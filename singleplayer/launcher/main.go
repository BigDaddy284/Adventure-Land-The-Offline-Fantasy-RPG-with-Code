//go:build windows

// Fantasy Land.exe: starts the game with no console windows (by running Play.bat hidden), opens the game window,
// and when the last game window closes, runs Stop.bat so the characters save and everything shuts down cleanly.
//
// Build (from this folder): GOOS=windows GOARCH=amd64 go build -ldflags "-H windowsgui -s -w" -o "../../Fantasy Land.exe"
package main

import (
	"encoding/json"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"syscall"
	"time"
	"unsafe"
)

const (
	gameURL    = "http://127.0.0.1:8090"
	profileDir = "FantasyLandSinglePlayer" // the game window's own Edge profile, in %LOCALAPPDATA% (same as Play.bat)
	title      = "Fantasy Land"
)

var (
	user32   = syscall.NewLazyDLL("user32.dll")
	kernel32 = syscall.NewLazyDLL("kernel32.dll")
	gdi32    = syscall.NewLazyDLL("gdi32.dll")

	pRegisterClassExW = user32.NewProc("RegisterClassExW")
	pCreateWindowExW  = user32.NewProc("CreateWindowExW")
	pDefWindowProcW   = user32.NewProc("DefWindowProcW")
	pGetMessageW      = user32.NewProc("GetMessageW")
	pTranslateMessage = user32.NewProc("TranslateMessage")
	pDispatchMessageW = user32.NewProc("DispatchMessageW")
	pPostQuitMessage  = user32.NewProc("PostQuitMessage")
	pPostMessageW     = user32.NewProc("PostMessageW")
	pShowWindow       = user32.NewProc("ShowWindow")
	pSetWindowTextW   = user32.NewProc("SetWindowTextW")
	pSendMessageW     = user32.NewProc("SendMessageW")
	pMessageBoxW      = user32.NewProc("MessageBoxW")
	pLoadCursorW      = user32.NewProc("LoadCursorW")
	pGetSystemMetrics = user32.NewProc("GetSystemMetrics")
	pSetForeground    = user32.NewProc("SetForegroundWindow")
	pDestroyWindow    = user32.NewProc("DestroyWindow")
	pGetModuleHandleW = kernel32.NewProc("GetModuleHandleW")
	pCreateMutexW     = kernel32.NewProc("CreateMutexW")
	pSetLastError     = kernel32.NewProc("SetLastError")
	pGetStockObject   = gdi32.NewProc("GetStockObject")
)

const (
	wmDestroy      = 0x0002
	wmClose        = 0x0010
	wmSetFont      = 0x0030
	wmCommand      = 0x0111
	wmApp          = 0x8000
	msgShow        = wmApp + 1
	msgHide        = wmApp + 2
	msgButton      = wmApp + 3
	msgQuit        = wmApp + 4
	buttonID       = 1
	createNoWindow = 0x08000000
)

type wndClassEx struct {
	Size, Style                        uint32
	WndProc                            uintptr
	ClsExtra, WndExtra                 int32
	Instance, Icon, Cursor, Background uintptr
	MenuName, ClassName                *uint16
	IconSm                             uintptr
}

type msg struct {
	Hwnd    uintptr
	Message uint32
	WParam  uintptr
	LParam  uintptr
	Time    uint32
	X, Y    int32
	Private uint32
}

var (
	window, label, button uintptr
	stopRequested         = make(chan struct{}, 1)
	gameDir               string
)

func utf16(s string) *uint16 { p, _ := syscall.UTF16PtrFromString(s); return p }

func requestStop() {
	select {
	case stopRequested <- struct{}{}:
	default:
	}
}

func wndProc(hwnd, message, wparam, lparam uintptr) uintptr {
	switch message {
	case wmClose:
		requestStop() // closing this window stops the game the same way the button does
		return 0
	case wmCommand:
		if wparam&0xffff == buttonID {
			requestStop()
		}
		return 0
	case msgShow:
		pShowWindow.Call(hwnd, 5)
		pSetForeground.Call(hwnd)
		return 0
	case msgHide:
		pShowWindow.Call(hwnd, 0)
		return 0
	case msgButton:
		pShowWindow.Call(button, wparam) // 5 shows, 0 hides
		return 0
	case msgQuit:
		pDestroyWindow.Call(hwnd)
		return 0
	case wmDestroy:
		pPostQuitMessage.Call(0)
		return 0
	}
	r, _, _ := pDefWindowProcW.Call(hwnd, message, wparam, lparam)
	return r
}

func createWindow() {
	instance, _, _ := pGetModuleHandleW.Call(0)
	cursor, _, _ := pLoadCursorW.Call(0, 32512)
	class := wndClassEx{WndProc: syscall.NewCallback(wndProc), Instance: instance, Cursor: cursor, Background: 16, ClassName: utf16("FantasyLandLauncher")}
	class.Size = uint32(unsafe.Sizeof(class))
	pRegisterClassExW.Call(uintptr(unsafe.Pointer(&class)))
	const width, height = 460, 170
	sw, _, _ := pGetSystemMetrics.Call(0)
	sh, _, _ := pGetSystemMetrics.Call(1)
	// WS_OVERLAPPED | WS_CAPTION | WS_SYSMENU | WS_MINIMIZEBOX
	window, _, _ = pCreateWindowExW.Call(0, uintptr(unsafe.Pointer(class.ClassName)), uintptr(unsafe.Pointer(utf16(title))), 0x00CA0000,
		(sw-width)/2, (sh-height)/2, width, height, 0, 0, instance, 0)
	font, _, _ := pGetStockObject.Call(17) // DEFAULT_GUI_FONT
	// WS_CHILD | WS_VISIBLE | SS_LEFT
	label, _, _ = pCreateWindowExW.Call(0, uintptr(unsafe.Pointer(utf16("STATIC"))), uintptr(unsafe.Pointer(utf16(""))), 0x50000000, 18, 16, width-50, 70, window, 0, instance, 0)
	// WS_CHILD | BS_PUSHBUTTON (shown only when needed)
	button, _, _ = pCreateWindowExW.Call(0, uintptr(unsafe.Pointer(utf16("BUTTON"))), uintptr(unsafe.Pointer(utf16("Stop Fantasy Land"))), 0x40000000, (width-170)/2, 88, 150, 28, window, buttonID, instance, 0)
	pSendMessageW.Call(label, wmSetFont, font, 1)
	pSendMessageW.Call(button, wmSetFont, font, 1)
}

func status(text string) { pSetWindowTextW.Call(label, uintptr(unsafe.Pointer(utf16(text)))) }
func show()              { pPostMessageW.Call(window, msgShow, 0, 0) }
func hide()              { pPostMessageW.Call(window, msgHide, 0, 0) }
func showButton(on bool) {
	if on {
		pPostMessageW.Call(window, msgButton, 5, 0)
	} else {
		pPostMessageW.Call(window, msgButton, 0, 0)
	}
}

func messageBox(text string, icon uintptr) {
	pMessageBoxW.Call(window, uintptr(unsafe.Pointer(utf16(text))), uintptr(unsafe.Pointer(utf16(title))), icon)
}

// Runs a .bat file from the game folder without a console window, adding its messages to logs\launcher.log
func runBatch(name string, launcher bool, log *os.File) error {
	cmd := exec.Command("cmd.exe", "/c", name)
	cmd.Dir = gameDir
	cmd.Stdout, cmd.Stderr = log, log
	cmd.Env = os.Environ()
	if launcher {
		cmd.Env = append(cmd.Env, "FL_LAUNCHER=1")
	}
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true, CreationFlags: createNoWindow}
	return cmd.Run()
}

// The last line Play.bat wrote, for the status window
func lastLine(path string) string {
	data, err := os.ReadFile(path)
	if err != nil {
		return ""
	}
	lines := strings.Split(strings.ReplaceAll(string(data), "\r", ""), "\n")
	for i := len(lines) - 1; i >= 0; i-- {
		line := strings.TrimRight(strings.TrimSpace(lines[i]), ". ")
		if line != "" {
			if len(line) > 140 {
				line = line[:140] + "..."
			}
			return line
		}
	}
	return ""
}

func lastLines(path string, count int) string {
	data, _ := os.ReadFile(path)
	var kept []string
	for _, line := range strings.Split(strings.ReplaceAll(string(data), "\r", ""), "\n") {
		if strings.TrimSpace(line) != "" {
			kept = append(kept, strings.TrimSpace(line))
		}
	}
	if len(kept) > count {
		kept = kept[len(kept)-count:]
	}
	return strings.Join(kept, "\n")
}

func profilePath() string { return filepath.Join(os.Getenv("LOCALAPPDATA"), profileDir) }

// Edge keeps a "lockfile" open in its profile folder for as long as any window of that profile is open
func gameWindowOpen() bool {
	handle, err := syscall.CreateFile(utf16(filepath.Join(profilePath(), "lockfile")), syscall.GENERIC_WRITE, 0, nil, syscall.OPEN_EXISTING, 0, 0)
	if err == nil {
		syscall.CloseHandle(handle)
		return false
	}
	return err == syscall.Errno(32) // ERROR_SHARING_VIOLATION: Edge has it open
}

// Stops Edge from keeping this profile running in the background after the last game window closes
func turnOffBackgroundMode() {
	path := filepath.Join(profilePath(), "Local State")
	state := map[string]any{}
	if data, err := os.ReadFile(path); err == nil {
		if json.Unmarshal(data, &state) != nil {
			return // leave a file we can't read alone
		}
	}
	background, _ := state["background_mode"].(map[string]any)
	if background == nil {
		background = map[string]any{}
	}
	if enabled, ok := background["enabled"].(bool); ok && !enabled {
		return
	}
	background["enabled"] = false
	state["background_mode"] = background
	if data, err := json.Marshal(state); err == nil {
		os.MkdirAll(profilePath(), 0755)
		os.WriteFile(path, data, 0644)
	}
}

func openGameWindow() bool {
	turnOffBackgroundMode()
	cmd := exec.Command("cmd.exe", "/c", "start", "", "msedge", "--app="+gameURL, "--user-data-dir="+profilePath(), "--no-first-run", "--window-size=1280,800")
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true, CreationFlags: createNoWindow}
	return cmd.Run() == nil
}

func openInBrowser() {
	cmd := exec.Command("cmd.exe", "/c", "start", "", gameURL)
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true, CreationFlags: createNoWindow}
	cmd.Run()
}

func stopGame(log *os.File) {
	showButton(false)
	status("Saving your characters and closing Fantasy Land...\n\nThis window closes by itself when everything has stopped.")
	show()
	runBatch("Stop.bat", false, log)
}

func run() {
	defer pPostMessageW.Call(window, msgQuit, 0, 0)

	if _, err := os.Stat(filepath.Join(gameDir, "Play.bat")); err != nil {
		messageBox("Fantasy Land.exe needs to be in the game folder, next to Play.bat.", 0x10)
		return
	}
	os.MkdirAll(filepath.Join(gameDir, "logs"), 0755)
	logPath := filepath.Join(gameDir, "logs", "launcher.log")
	log, err := os.Create(logPath)
	if err != nil {
		messageBox("Couldn't write to the logs folder:\n"+err.Error(), 0x10)
		return
	}
	defer log.Close()

	status("Starting Fantasy Land...\n\nThe very first start installs everything and can take a few minutes.")
	show()
	started := make(chan error, 1)
	go func() { started <- runBatch("Play.bat", true, log) }()
	for waiting := true; waiting; {
		select {
		case err = <-started:
			waiting = false
		case <-time.After(400 * time.Millisecond):
			if line := lastLine(logPath); line != "" {
				status("Starting Fantasy Land...\n\n" + line)
			}
		}
	}
	if err != nil {
		hide()
		messageBox("Fantasy Land couldn't start:\n\n"+lastLines(logPath, 6)+"\n\nThe full details are in the logs folder, in launcher.log.", 0x10)
		stopGame(log)
		return
	}

	// Wait for the game window, then for the last game window to close
	edge := openGameWindow()
	for i := 0; edge && i < 60 && !gameWindowOpen(); i++ {
		time.Sleep(time.Second)
	}
	if edge && gameWindowOpen() {
		hide()
		for gameWindowOpen() {
			select {
			case <-stopRequested:
				stopGame(log)
				return
			case <-time.After(time.Second):
			}
		}
		// A moment to be sure it closed rather than restarted
		time.Sleep(2 * time.Second)
		if gameWindowOpen() {
			for gameWindowOpen() {
				time.Sleep(time.Second)
			}
		}
	} else {
		// No Edge (or it couldn't be watched): use the normal browser, and this window's button to stop
		if !edge {
			openInBrowser()
		}
		status("Fantasy Land is running in your browser.\n\nWhen you're done playing, click Stop to save and close everything.")
		showButton(true)
		show()
		<-stopRequested
	}
	stopGame(log)
}

func main() {
	exe, _ := os.Executable()
	gameDir = filepath.Dir(exe)

	// Only one launcher at a time: a second double-click just opens another game window
	pSetLastError.Call(0)
	_, _, lastErr := pCreateMutexW.Call(0, 0, uintptr(unsafe.Pointer(utf16("FantasyLandLauncher"))))
	if lastErr == syscall.Errno(183) { // ERROR_ALREADY_EXISTS
		openGameWindow()
		return
	}

	runtime.LockOSThread()
	createWindow()
	go run()
	var m msg
	for {
		r, _, _ := pGetMessageW.Call(uintptr(unsafe.Pointer(&m)), 0, 0, 0)
		if r == 0 || int32(r) == -1 {
			break
		}
		pTranslateMessage.Call(uintptr(unsafe.Pointer(&m)))
		pDispatchMessageW.Call(uintptr(unsafe.Pointer(&m)))
	}
}
