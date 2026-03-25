fx_version 'cerulean'
game 'gta5'

-- Script Information
name 'MY_SCRIPT_NAME'
description 'وصف السكريبت'
version '1.0.0'
author 'اسمك'

-- Lua Files
client_scripts {
    'client/client.lua'
}

server_scripts {
    '@oxmysql/lib/MySQL.lua',
    'server/server.lua'
}

shared_scripts {
    '@ox_lib/init.lua',
    'shared/shared.lua',
    'config.lua'
}

-- UI Files
ui_page 'html/index.html'

files {
    'html/index.html',
    'html/style.css',
    'html/app.js'
}

-- Dependencies
dependencies {
    'qb-core',
    'oxmysql',
    'ox_lib'
}
