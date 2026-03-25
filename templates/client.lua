-- ═══════════════════════════════════════════════════════════════════════════
--  Client Script Template — QBCore Framework
-- ═══════════════════════════════════════════════════════════════════════════

local QBCore = exports['qb-core']:GetCoreObject()

-- ─── Variables ───────────────────────────────────────────────────────────
local isMenuOpen = false

-- ─── NUI Callback ─────────────────────────────────────────────────────────
RegisterNUICallback('closeUI', function(data, cb)
    isMenuOpen = false
    SetNuiFocus(false, false)
    cb('ok')
end)

-- ─── Events ───────────────────────────────────────────────────────────────
RegisterNetEvent('MY_SCRIPT:client:OpenMenu', function()
    if isMenuOpen then return end
    isMenuOpen = true
    SetNuiFocus(true, true)
    SendNUIMessage({
        action = 'open',
        data = {}
    })
end)

-- ─── Commands ─────────────────────────────────────────────────────────────
RegisterCommand('myscript', function()
    TriggerServerEvent('MY_SCRIPT:server:CheckPermission')
end, false)

-- ─── Keybind ──────────────────────────────────────────────────────────────
RegisterKeyMapping('myscript', 'فتح السكريبت', 'keyboard', 'F6')

-- ─── Thread ────────────────────────────────────────────────────────────────
CreateThread(function()
    while true do
        Wait(0)
        -- Main loop logic here
    end
end)
