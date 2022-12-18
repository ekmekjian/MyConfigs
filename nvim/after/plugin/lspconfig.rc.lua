local status,lspc = pcall(require,'lspconfig')
if (not status) then return end

local on_attach = function(client, bufnr)
	vim.api.nvim_buf_set_option(bufnr,'omnifunc', 'v:lua.vim.lsp.omnifunc')
end
lspc.sourcekit.setup{
	on_attach = on_attach,
	filetypes = { "swift", "c", "cpp", "objective-c", "objective-cpp" },
	cmd = {"sourcekit-lsp"}
}
lspc.sumneko_lua.setup{
	on_attach = on_attach,
	settings = {
		Lua = {
			version = 'LuaJIT',
		},
			diagnostics = {
				globals = {'vim'},
			},
			workspace = {
				library = vim.api.nvim_get_runtime_file("",true),
			},
			telemetry = {
				enable = false,
			},
		},
	}
lspc.arduino_language_server.setup{
	cmd = {
	"arduino_language_server",
	"-cli-config","/User/black/Library/Arduino15/arduino-cli.yaml",
	"-fqbn", "arduino:avr:uno",
	"-cli", "arduino-cli",
	"-clangd", "clangd"
	},
	filetypes = {"arduino"}
}
lspc.bashls.setup{}
