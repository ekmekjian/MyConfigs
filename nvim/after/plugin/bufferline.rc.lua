local status, bufferline = pcall(require, "bufferline")
if (not status) then return end
bufferline.setup({
options = {
    color_icons = true,
    numbers = "ordinal",
    diagnostics = "nvim_lsp",
    show_close_icon = false,
    show_buffer_close_icon = false,
    buffer_close_icon = '',
    modified_icon = '●',
    close_icon = '',
    left_trunc_marker = '',
     right_trunc_marker = '',
     indicator = {
	     style = 'underline',
     },
     hover = {
	enabled = true,
	delay = 200,
	reveal = {'close'}
  },
  },
  highlights = {
    separator = {
      fg = '#073642',
      bg = '#002b36',
    },
    separator_selected = {
      fg = '#073642',
    },
    buffer_selected = {
      fg = '#eb1749',
      bold = true,
    },
  },
})
vim.keymap.set('n', '<Tab>', '<Cmd>BufferLineCycleNext<CR>', {})
vim.keymap.set('n', '<S-Tab>', '<Cmd>BufferLineCyclePrev<CR>', {})
