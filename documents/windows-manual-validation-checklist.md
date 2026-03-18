# Windows Manual Validation Checklist

Task 6.4 scope: validate the Windows end-to-end flow with the current MVP scaffold.

## Preconditions

- Windows host
- App built and launched locally
- `Pandoc` installed and discoverable on `PATH`
- A usable PDF engine installed for `MD -> PDF`
- Sample `MD` and `DOCX` files available for validation

## Checklist

- [ ] Launch the app on Windows and confirm the main window opens without crashes.
- [ ] Confirm the startup state shows the expected environment banner or ready state.
- [ ] Select files with the native Windows file picker and confirm the chosen paths appear in the UI.
- [ ] Run a `DOCX -> MD` conversion and confirm the output file is created in the selected directory.
- [ ] Run an `MD -> DOCX` conversion and confirm the output file is created in the selected directory.
- [ ] Run an `MD -> PDF` conversion and confirm the output file is created in the selected directory.
- [ ] Confirm the job list updates from queued or processing into success for each completed item.
- [ ] Open the output folder from the results panel and confirm File Explorer opens the expected directory.
- [ ] Quit the app by closing the last window and confirm Windows app behavior matches the Electron default for the platform.
- [ ] Reopen the app from the taskbar or Start menu and confirm the window can be restored without stale job state in the UI.

## Expected Evidence

- Successful output files for each supported conversion path
- File Explorer opens the intended output directory
- No unexpected crash dialog or blocked UI state during the flow
