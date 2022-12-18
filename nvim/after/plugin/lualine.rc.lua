
local status, lualine = pcall(require,'lualine')
if(not status) then return end

lualine.setup{
	options = {
		icons_enabled = true,
		theme = 'material',
		section_separators = { left = '', right = '' },
		component_separators = { left = '', right = '' },
		disabled_filetypes = {}},

	sections = {
		lualine_a = {'mode'},
		lualine_b = {'branch','diff','diagnostics'},
		lualine_c = {{
			'filename',
		file_status = true,
		path = 0}},
		lualine_x = {'filetype'},
		lualine_y = {},
		lualine_z = {}
	}
}
