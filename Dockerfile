# 🚀 DOCKERFILE OPTIMIZADO PARA RENDER
# Etapa 1: Compilar el proyecto con Maven y Java 21
FROM maven:3.9-eclipse-temurin-21 AS build

WORKDIR /workspace/app

# Copiamos archivos de Maven
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .

# Damos permisos y descargamos dependencias (esto se cachea)
RUN chmod +x mvnw && ./mvnw dependency:go-offline -B

# Copiamos código fuente
COPY src ./src

# Compilamos el proyecto (mvnw ya tiene permisos)
RUN ./mvnw clean package -DskipTests -B

# Etapa 2: Imagen final optimizada
FROM eclipse-temurin:21-jre
WORKDIR /app

# Copiamos el JAR compilado
COPY --from=build /workspace/app/target/*.jar app.jar

# Render usa el puerto que asigna en la variable $PORT
EXPOSE $PORT

# Comando optimizado para Render con perfil render
ENTRYPOINT ["java", "-Dspring.profiles.active=render", "-Djava.security.egd=file:/dev/./urandom", "-jar", "/app/app.jar"]