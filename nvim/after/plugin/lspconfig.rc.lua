local lsp = require("lsp-zero")

lsp.preset("recommended")

lsp.ensure_installed({
  'tsserver',
  'eslint',
  'rust_analyzer',
'sourcekit-lsp',
})

local cmp = require('cmp')
local cmp_select = {behavior = cmp.SelectBehavior.Select}
local cmp_mappings = lsp.defaults.cmp_mappings({
  ['<C-p>'] = cmp.mapping.select_prev_item(cmp_select),
  ['<C-n>'] = cmp.mapping.select_next_item(cmp_select),
  ['<C-y>'] = cmp.mapping.confirm({ select = true }),
  ["<C-Space>"] = cmp.mapping.complete(),
})

lsp.set_preferences({
  sign_icons = { }
})

lsp.setup_nvim_cmp({
  mapping = cmp_mappings
})
lsp.on_attach(function(client, bufnr)
  local opts = {buffer = bufnr, remap = false}

  vim.keymap.set("n", "gd", function() vim.lsp.buf.definition() end, opts)
  vim.keymap.set("n", "<leader>K", function() vim.lsp.buf.hover() end, opts)
  vim.keymap.set("n", "<leader>vws", function() vim.lsp.buf.workspace_symbol() end, opts)
  vim.keymap.set("n", "<leader>vd", function() vim.diagnostic.open_float() end, opts)
  vim.keymap.set("n", "[d", function() vim.diagnostic.goto_next() end, opts)
  vim.keymap.set("n", "]d", function() vim.diagnostic.goto_prev() end, opts)
  vim.keymap.set("n", "<leader>vca", function() vim.lsp.buf.code_action() end, opts)
  vim.keymap.set("n", "<leader>vrr", function() vim.lsp.buf.references() end, opts)
  vim.keymap.set("n", "<leader>vrn", function() vim.lsp.buf.rename() end, opts)
  vim.keymap.set("i", "<C-h>", function() vim.lsp.buf.signature_help() end, opts)
end)

lsp.setup()

require'lspconfig'.marksman.setup{}






-- OLD CONFIG
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
-- lspc.sumneko_lua.setup{
-- 	on_attach = on_attach,
-- 	settings = {
-- 		Lua = {
-- 			version = 'LuaJIT',
-- 		},
-- 			diagnostics = {
-- 				globals = {'vim'},
-- 			},
-- 			workspace = {
-- 				library = vim.api.nvim_get_runtime_file("",true),
-- 			},
-- 			telemetry = {
-- 				enable = false,
-- 			},
-- 		},
-- 	}
-- lspc.arduino_language_server.setup{
-- 	cmd = {
-- 	"arduino_language_server",
-- 	"-cli-config","/User/black/Library/Arduino15/arduino-cli.yaml",
-- 	"-fqbn", "arduino:avr:uno",
-- 	"-cli", "arduino-cli",
-- 	"-clangd", "clangd"
-- 	},
-- 	filetypes = {"arduino"}
-- }
-- lspc.bashls.setup{}
-- lspc.tsserver.setup{
-- 	on_attach = on_attach,
-- 	filetypes = {"typescript","typescriptreact", "typescript.tsx"},
-- 	com = {"typescript-language-server", "--stdio"}
-- }

