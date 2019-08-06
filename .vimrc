execute pathogen#infect()
set encoding=UTF-8
set guifont=OverpassMono\ Nerd\ Font\ 10
colo gruvbox-material 
execute pathogen#infect()
let g:indent_guides_enable_on_vim_startup = 1
let g:airline_theme='badwolf'
let g:airline_powerline_fonts =1
set runtimepath+=~/.vim_runtime
syntax on
set autoindent
set number
autocmd vimenter * NERDTree
map <C-n> :NERDTreeToggle<CR>
let NERDTreeShowHidden=0
let g:webdevicons_enable_nerdtree = 1
autocmd StdinReadPre * let s:std_in=1
autocmd VimEnter * if argc() == 0 && !exists("s:std_in") | NERDTree | endif
autocmd StdinReadPre * let s:std_in=1
autocmd VimEnter * if argc() == 1 && isdirectory(argv()[0]) && !exists("s:std_in") | exe 'NERDTree' argv()[0] | wincmd p | ene | exe 'cd '.argv()[0] | endif
set ts=2 sw=2 et
let g:indent_guides_start_level=1
let g:indent_guides_guide_size=1
"set background=dark
inoremap {      {}<Left>
inoremap [      []<Left>
inoremap (      ()<Left>
inoremap '      ''<Left>
inoremap "      ""<Left>
nmap <silent> <A-Up> :wincmd k<CR>
nmap <silent> <A-Down> :wincmd j<CR>
nmap <silent> <A-Left> :wincmd h<CR>
nmap <silent> <A-Right> :wincmd l<CR>
hi Normal guibg=NONE ctermbg=NONE
