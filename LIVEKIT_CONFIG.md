# إعدادات LiveKit الصحيحة

## يجب تحديث ملف `.env` في Backend

افتح الملف:
```
d:/live_app/apps/api/.env
```

وتأكد من هذه الإعدادات:

```env
# LiveKit Settings - مهم جداً!
LIVEKIT_API_KEY=RYKAXVztBmSn8qjusGLI6WT9gr2fc30v
LIVEKIT_API_SECRET=hofkLYXCzx24DdO1n6FZbJeAB5NTWuc9
LIVEKIT_URL=ws://localhost:7880
```

## بعد التحديث:

1. أعد تشغيل Backend (Ctrl+C ثم npm run start:dev)
2. جرب الانضمام للغرفة مرة أخرى

## المفاتيح الحالية في livekit.yaml:
- API Key: RYKAXVztBmSn8qjusGLI6WT9gr2fc30v
- API Secret: hofkLYXCzx24DdO1n6FZbJeAB5NTWuc9
