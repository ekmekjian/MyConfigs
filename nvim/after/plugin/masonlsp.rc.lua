local status, masonlsp = pcall(staus,"mason-lspconfig")
if (not status) then return end

masonlsp.setup()
