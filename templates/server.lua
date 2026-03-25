-- ═══════════════════════════════════════════════════════════════════════════
--  Server Script Template — QBCore Framework
-- ═══════════════════════════════════════════════════════════════════════════

local QBCore = exports['qb-core']:GetCoreObject()

-- ─── Events ───────────────────────────────────────────────────────────────
RegisterNetEvent('MY_SCRIPT:server:CheckPermission', function()
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player then return end

    -- Check job, permission, etc.
    TriggerClientEvent('MY_SCRIPT:client:OpenMenu', src)
end)

-- ─── Callbacks ────────────────────────────────────────────────────────────
QBCore.Functions.CreateCallback('MY_SCRIPT:GetData', function(source, cb)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player then cb(nil) return end

    -- Fetch data from DB
    MySQL.query('SELECT * FROM my_table WHERE citizenid = ?', {
        Player.PlayerData.citizenid
    }, function(result)
        cb(result)
    end)
end)

-- ─── Commands ─────────────────────────────────────────────────────────────
QBCore.Commands.Add('admincommand', 'أمر للأدمن', {}, false, function(source, args)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player then return end

    if not QBCore.Functions.HasPermission(src, 'admin') then
        TriggerClientEvent('QBCore:Notify', src, 'ليس لديك صلاحية', 'error')
        return
    end

    -- Logic here
end, 'admin')
