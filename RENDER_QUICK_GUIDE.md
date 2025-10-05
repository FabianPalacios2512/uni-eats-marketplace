# 🚀 GUÍA RÁPIDA - NUEVO PROYECTO RENDER

## 📋 VARIABLES DE ENTORNO MÍNIMAS

### ✅ OPCIÓN 1: H2 (Pruebas Rápidas)
```bash
# Solo estas 2 variables:
SPRING_PROFILES_ACTIVE=render
UPLOAD_DIR=/tmp/uploads
```
**Resultado:** App funcionará con H2 en memoria (datos temporales)

---

### ✅ OPCIÓN 2: PostgreSQL/Supabase (Producción)
```bash
# Estas 4 variables:
DATABASE_URL=jdbc:postgresql://db.lfvweearttrisbbhemld.supabase.co:5432/postgres?sslmode=require
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=F1001504182.ae
SPRING_PROFILES_ACTIVE=render
UPLOAD_DIR=/tmp/uploads
```
**Resultado:** App funcionará con Supabase (datos persistentes)

---

## 🎯 PASOS EN RENDER:

1. **Crear New Web Service**
2. **Conectar repositorio:** `FabianPalacios2512/uni-eats-marketplace`
3. **Configurar:**
   - **Build Command:** `./mvnw clean package -DskipTests`
   - **Start Command:** (automático)
4. **Environment Variables:** Copiar OPCIÓN 1 o 2
5. **Deploy** 🚀

## 📊 DIAGNÓSTICO:
- Los logs mostrarán claramente qué base de datos está usando
- H2: ⚠️ Datos temporales (para pruebas)
- PostgreSQL: ✅ Datos persistentes (para producción)

## 🔄 CAMBIO FÁCIL:
- Para cambiar de H2 a PostgreSQL: Solo agregar las 3 variables de DB
- Para cambiar de PostgreSQL a H2: Solo eliminar las 3 variables de DB