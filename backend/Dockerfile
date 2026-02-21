# ── Stage 1: Build the JAR ─────────────────────────────────────────────────
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

# Cache dependencies separately from source
COPY pom.xml .
RUN mvn -B dependency:go-offline

# Build the JAR
COPY src ./src
RUN mvn -B package -DskipTests

# ── Stage 2: Minimal runtime image ─────────────────────────────────────────
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

COPY --from=build /app/target/tech-simplified-backend-0.0.1-SNAPSHOT.jar app.jar

# Back4App injects PORT=80 at runtime (or 8080 depending on plan).
# Our application.properties reads: server.port=${PORT:8081}
# Spring Boot automatically listens on whatever port Back4App injects.
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
