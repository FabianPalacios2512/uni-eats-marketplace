# Etapa 1: Compilar el proyecto con Maven y Java 17
FROM maven:3.9-eclipse-temurin-17 AS build

WORKDIR /workspace/app

COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .
COPY src ./src

# --- ¡LA LÍNEA CLAVE QUE ARREGLA EL ERROR! ---
# Le damos permiso de ejecución al script de Maven.
RUN chmod +x mvnw

# Usamos -B para modo batch y -DskipTests para acelerar
RUN ./mvnw -B package -DskipTests

# Etapa 2: Crear la imagen final de ejecución
FROM eclipse-temurin:17-jre
WORKDIR /app

# Copiamos el archivo .jar compilado desde la etapa anterior
COPY --from=build /workspace/app/target/*.jar app.jar

# Expone el puerto 8080 para que el servidor de AWS sepa a dónde dirigir el tráfico
EXPOSE 8080

# El comando de arranque simple y robusto
ENTRYPOINT ["java", "-jar","/app/app.jar"]