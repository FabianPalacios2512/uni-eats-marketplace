# 🔧 CONFIGURACIÓN PARA RENDER - SOLUCIÓN pgBouncer
# ===============================================================

## Variables de Entorno para Render:

### OPCIÓN A: Variables separadas (recomendada)
DATABASE_URL=jdbc:postgresql://aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&prepareThreshold=0
DATABASE_USERNAME=postgres.lfvweearttrisbbhemld
DATABASE_PASSWORD=[tu-contraseña-supabase]
DATABASE_DRIVER=org.postgresql.Driver
DATABASE_PLATFORM=org.hibernate.dialect.PostgreSQLDialect
SPRING_PROFILES_ACTIVE=render
UPLOAD_DIR=/tmp/uploads

### OPCIÓN B: Una sola URL (alternativa)
DATABASE_URL=jdbc:postgresql://aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&user=postgres.lfvweearttrisbbhemld&password=[tu-contraseña]&prepareThreshold=0

## ⚠️ IMPORTANTE: El parámetro prepareThreshold=0 es CLAVE
- Deshabilita los prepared statements que causan conflictos con pgBouncer
- Sin esto, seguirás viendo: "ERROR: prepared statement 'S_XX' already exists"

## 🔧 Lo que cambió en application-render.properties:
- spring.jpa.hibernate.ddl-auto=update (ya no create-drop)
- Configuraciones específicas para pgBouncer
- hikari.auto-commit=false para mejor compatibilidad

## 📝 Después de actualizar:
1. Guarda las variables en Render
2. Redeploy
3. Los errores de prepared statements deberían desaparecer
4. Los endpoints deberían funcionar correctamente