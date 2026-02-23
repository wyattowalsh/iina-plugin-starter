-- reload-webviews.applescript
-- Tells IINA to reload its webview content without restarting the app.
-- Useful during UI development — entry scripts still need a full restart.
--
-- Usage:  osascript scripts/reload-webviews.applescript

tell application "IINA"
	activate
end tell

tell application "System Events"
	tell process "IINA"
		-- Cmd+Shift+R to reload webviews (IINA developer shortcut)
		keystroke "r" using {command down, shift down}
	end tell
end tell
