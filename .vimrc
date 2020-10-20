call plug#begin()
Plug 'neoclide/coc.nvim', {'do': 'yarn install --frozen-lockfile'}
Plug 'dart-lang/dart-vim-plugin'
Plug 'thosakwe/vim-flutter'
Plug 'tpope/vim-fugitive'
Plug 'vim-airline/vim-airline'
Plug 'airblade/vim-gitgutter'
Plug 'vim-airline/vim-airline-themes'
Plug 'dylanaraps/wal.vim'
call plug#end()
set shell=/bin/sh
set encoding=UTF-8

set guifont=OverpassMono\ Nerd\ Font\ 10

"Remap split keys
nnoremap <C-h> <C-w>h
nnoremap <C-j> <C-w>j
nnoremap <C-k> <C-w>k
nnoremap <C-l> <C-w>l
let g:indent_guides_enable_on_vim_startup = 1

set runtimepath+=~/.vim_runtime

syntax on

set autoindent

set number


set ts=2 sw=2 et

let g:indent_guides_start_level=1

let g:indent_guides_guide_size=1

set background=dark

inoremap {      {}<Left>

inoremap [      []<Left>

inoremap (      ()<Left>

inoremap '      ''<Left>

inoremap "      ""<Left>

nmap <silent> <A-Up> :wincmd k<CR>

nmap <silent> <A-Down> :wincmd j<CR>

nmap <silent> <A-Left> :wincmd h<CR>

nmap <silent> <A-Right> :wincmd l<CR>

inoremap <silent><expr> <TAB>
      \ pumvisible() ? "\<C-n>" :
      \ <SID>check_back_space() ? "\<TAB>" :
      \ coc#refresh()

inoremap <expr><S-TAB> pumvisible() ? "\<C-p>" : "\<C-h>"



function! s:check_back_space() abort

    let col = col('.') - 1

    return !col || getline('.')[col - 1]  =~# '\s'

endfunction
