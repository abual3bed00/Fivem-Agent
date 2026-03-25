# اسم السكريبت

وصف مختصر للسكريبت وما يفعله.

---

## المميزات

- ✅ الميزة الأولى
- ✅ الميزة الثانية
- ✅ الميزة الثالثة

## المتطلبات

- [qb-core](https://github.com/qbcore-framework/qb-core)
- [oxmysql](https://github.com/overextended/oxmysql)
- [ox_lib](https://github.com/overextended/ox_lib)

## التثبيت

1. **تنزيل السكريبت** وضعه في مجلد `resources/`
2. **استيراد قاعدة البيانات** (إذا وجدت)
   ```sql
   -- database.sql
   ```
3. **إضافة للـ server.cfg**:
   ```
   ensure MY_SCRIPT_NAME
   ```
4. **إعادة تشغيل السيرفر**

## الأوامر

| الأمر | الوصف | الصلاحية |
|---|---|---|
| `/myscript` | فتح القائمة | جميع اللاعبين |
| `/admincommand` | أمر الأدمن | Admin |

## الإعدادات

راجع ملف `config.lua` لتخصيص جميع الإعدادات.

## الترخيص

MIT License — راجع ملف LICENSE

## المطور

- **Discord**: discord.gg/yourserver
- **GitHub**: github.com/yourusername
