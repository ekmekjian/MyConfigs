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
	--LSP stuff
use {
	  'VonHeikemen/lsp-zero.nvim',
	  requires = {
		  -- LSP Support
		  {'neovim/nvim-lspconfig'},
		  {'williamboman/mason.nvim'},
		  {'williamboman/mason-lspconfig.nvim'},

		  -- Autocompletion
		  {'hrsh7th/nvim-cmp'},
		  {'hrsh7th/cmp-buffer'},
		  {'hrsh7th/cmp-path'},
		  {'saadparwaiz1/cmp_luasnip'},
		  {'hrsh7th/cmp-nvim-lsp'},
		  {'hrsh7th/cmp-nvim-lua'},

		  -- Snippets
		  {'L3MON4D3/LuaSnip'},
		  {'rafamadriz/friendly-snippets'},
	  }
  }

  use("folke/zen-mode.nvim")
  use("github/copilot.vim")
-- use {'neovim/nvim-lspconfig',
-- 		requires = {
-- 	'williamboman/mason.nvim',
-- 	'williamboman/mason-lspconfig.nvim',
-- 	'j-hui/fidget.nvim',
-- 	  {'L3MON4D3/LuaSnip'},
-- 	  {'rafamadriz/friendly-snippets'},
-- 	'folke/neodev.nvim'},}
-- use 'prabirshrestha/vim-lsp'
-- use 'onsails/lspkind-nvim'
-- use ({
-- 	"glepnir/lspsaga.nvim",
-- 	branch = "main",
-- 	requires = {{"nvim-tree/nvim-web-devicons"}}
-- 	})

	-- autopairs and autotags
use 'windwp/nvim-ts-autotag'
use 'windwp/nvim-autopairs'

	-- git stuff
use 'tpope/vim-fugitive'
use 'tpope/vim-rhubarb'
use 'lewis6991/gitsigns.nvim'


use 'lukas-reineke/indent-blankline.nvim'-- Add Indentation on blank lines
use 'numToStr/Comment.nvim' -- "gc" to comment visual lines
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
-- Fuzzy Finder (files, lsp, etc)
  use { 'nvim-telescope/telescope.nvim', branch = '0.1.x', requires = { 'nvim-lua/plenary.nvim' } }

  -- Fuzzy Finder Algorithm which requires local dependencies to be built. Only load if `make` is available
  use { 'nvim-telescope/telescope-fzf-native.nvim', run = 'make', cond = vim.fn.executable 'make' == 1 }

end)


-- Minor Plugin setups
-- Enable Comment.nvim
require('Comment').setup()

-- Enable `lukas-reineke/indent-blankline.nvim`
-- See `:help indent_blankline.txt`
require('indent_blankline').setup {
  char = '┊',
  show_trailing_blankline_indent = false,
}

-- Gitsigns
-- See `:help gitsigns.txt`
require('gitsigns').setup {
  signs = {
    add = { text = '+' },
    change = { text = '~' },
    delete = { text = '_' },
    topdelete = { text = '‾' },
    changedelete = { text = '~' },
  },
}

