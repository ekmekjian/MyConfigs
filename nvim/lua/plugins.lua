local status, packer = pcall(require,"packer")
if (not status) then
	print("Packer is not installed")
	return
end
vim.cmd [[packadd packer.nvim]]

packer.startup(function(use)
use 'wbthomason/packer.nvim'
use 'marko-cerovac/material.nvim'
use 'neovim/nvim-lspconfig'
use 'prabirshrestha/vim-lsp'
use 'onsails/lspkind-nvim'
use 'hrsh7th/cmp-buffer'
use 'hrsh7th/cmp-nvim-lsp'
use 'hrsh7th/nvim-cmp'
use 'L3MON4D3/LuaSnip'
use 'akinsho/nvim-bufferline'
use 'windwp/nvim-ts-autotag'
use 'windwp/nvim-autopairs'
use 'nvim-treesitter/nvim-treesitter'
use {'akinsho/bufferline.nvim', tag = "v3.*", requires = 'kyazdani42/nvim-web-devicons'}
use{
	'nvim-lualine/lualine.nvim',
	requires = {'kyazdani42/nvim-web-devicons', opt=true}
}
end)
