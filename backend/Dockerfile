FROM gradle:8.5-jdk17 AS builder

WORKDIR /app
COPY . .
RUN gradle clean bootJar --no-daemon

FROM eclipse-temurin:17.0.15_6-jdk

WORKDIR /app

COPY --from=builder /app/build/libs/*.jar app.jar

ENV SPRING_PROFILES_ACTIVE=local \
    JAVA_OPTS="-Xms512m -Xmx1024m"

EXPOSE 8080

ENTRYPOINT ["java"]
CMD ["-Xms512m", "-Xmx1024m", "-jar", "app.jar"]