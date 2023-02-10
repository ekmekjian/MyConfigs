local status, packer = pcall(require,"packer")
if (not status) then
	print("Packer is not installed")
	return
end
vim.cmd [[packadd packer.nvim]]

packer.startup(function(use)
use 'wbthomason/packer.nvim'
use 'marko-cerovac/material.nvim'
use 'tanvirtin/monokai.nvim'
use {'neovim/nvim-lspconfig',
		requires = {
	'williamboman/mason.nvim',
	'williamboman/mason-lspconfig.nvim',
	'j-hui/fidget.nvim',
	  {'L3MON4D3/LuaSnip'},
	  {'rafamadriz/friendly-snippets'},
	'folke/neodev.nvim'},}
use 'prabirshrestha/vim-lsp'
use 'onsails/lspkind-nvim'
use 'hrsh7th/cmp-buffer'
use 'hrsh7th/cmp-nvim-lsp'
use 'hrsh7th/nvim-cmp'
use 'L3MON4D3/LuaSnip'
use 'windwp/nvim-ts-autotag'
use 'windwp/nvim-autopairs'
use {
		'nvim-treesitter/nvim-treesitter',
		run = '.TSUpdate'
	}
use {'akinsho/bufferline.nvim', tag = "v3.*", requires = 'kyazdani42/nvim-web-devicons'}
use{
	'nvim-lualine/lualine.nvim',
	requires = {'kyazdani42/nvim-web-devicons', opt=true}
}
use {"ellisonleao/glow.nvim"}
use {
  'nvim-telescope/telescope.nvim', tag = '0.1.1',
  requires = { {'nvim-lua/plenary.nvim'} }
}
end)
