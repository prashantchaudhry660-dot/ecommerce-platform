# ==============================================================
# Stage 1: Build Stage using Maven and OpenJDK 17
# ==============================================================
FROM maven:3.9.6-eclipse-temurin-17 AS builder
WORKDIR /app

# Copy project descriptor and download dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B || true

# Copy source code and build production jar
COPY src ./src
RUN mvn clean package -DskipTests -B

# ==============================================================
# Stage 2: Lightweight Production Runtime Stage
# ==============================================================
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

# Run as non-privileged system user for container security
RUN addgroup --system spring && adduser --system spring --ingroup spring
USER spring:spring

# Copy repackaged runnable jar from build stage
COPY --from=builder /app/target/*.jar app.jar

# Configurable server port with default 8080
ENV PORT=8080
EXPOSE ${PORT}

# Launch Spring Boot with optimized JVM flags
ENTRYPOINT ["sh", "-c", "java -Djava.security.egd=file:/dev/./urandom -jar app.jar"]
