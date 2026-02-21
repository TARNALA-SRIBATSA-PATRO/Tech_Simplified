# ── Stage 1: Build the JAR ─────────────────────────────────────────────────
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

# Copy pom first for dependency caching
COPY pom.xml .
RUN mvn -B dependency:go-offline

# Copy source and build
COPY src ./src
RUN mvn -B package -DskipTests

# ── Stage 2: Minimal runtime image ─────────────────────────────────────────
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

COPY --from=build /app/target/tech-simplified-backend-0.0.1-SNAPSHOT.jar app.jar

# Koyeb injects $PORT at runtime (default 8000); our app.properties already reads it
EXPOSE 8000

ENTRYPOINT ["java", "-jar", "app.jar"]
