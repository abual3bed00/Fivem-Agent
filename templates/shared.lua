-- ═══════════════════════════════════════════════════════════════════════════
--  Shared Script Template — Config & Shared Data
-- ═══════════════════════════════════════════════════════════════════════════

Config = {}

-- General Settings
Config.Debug = false
Config.Locale = 'ar'

-- Jobs allowed to use this script
Config.AllowedJobs = {
    ['police'] = 0,
    ['ambulance'] = 0,
    ['mechanic'] = 0,
}

-- Locations
Config.Locations = {
    {
        coords = vector3(0.0, 0.0, 0.0),
        heading = 0.0,
        label = 'الموقع الأول',
    },
}

-- Items
Config.Items = {
    ['item_name'] = {
        label = 'اسم الغرض',
        weight = 100,
        usable = true,
    },
}

-- Prices
Config.Prices = {
    base = 100,
    max = 1000,
}

-- Notifications
Config.Notifications = {
    success = 'تمت العملية بنجاح',
    error = 'حدث خطأ',
    noPermission = 'ليس لديك صلاحية',
}
