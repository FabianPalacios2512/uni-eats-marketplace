# --- Etapa de Construcción (Build Stage) ---
# Usamos una imagen de Maven con Java 17 para compilar el proyecto
FROM maven:3.8.5-openjdk-17 AS build

# Establecemos el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiamos primero el archivo pom.xml para aprovechar el caché de Docker
COPY pom.xml .

# Descargamos todas las dependencias
RUN mvn dependency:go-offline

# Copiamos todo el código fuente del proyecto
COPY src ./src

# Empaquetamos la aplicación en un archivo .jar, omitiendo los tests
RUN mvn clean package -DskipTests


# --- Etapa de Ejecución (Run Stage) ---
# Usamos una imagen ligera de Java 17 solo con el entorno de ejecución (JRE)
FROM eclipse-temurin:17-jre-focal

# Establecemos el directorio de trabajo
WORKDIR /app

# Copiamos el .jar generado en la etapa de construcción
COPY --from=build /app/target/*.jar app.jar

# Exponemos el puerto en el que corre tu aplicación Spring Boot
EXPOSE 8081

# Comando para ejecutar la aplicación cuando el contenedor inicie
ENTRYPOINT ["java", "-jar", "app.jar"]