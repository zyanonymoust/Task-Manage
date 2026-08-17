pipeline {
    agent any

    triggers {
        pollSCM('* * * * *')
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Unit Test') {
            steps {
                bat 'dotnet test --configuration Release'
            }
        }

        stage('Docker Build') {
            steps {
                bat '"C:\\Users\\Hp\\AppData\\Local\\Programs\\DockerDesktop\\resources\\bin\\docker-compose.exe" -p task-manage build'
            }
        }

        stage('Start Containers') {
            steps {
                bat '"C:\\Users\\Hp\\AppData\\Local\\Programs\\DockerDesktop\\resources\\bin\\docker-compose.exe" -p task-manage up -d'
            }
        }

        stage('E2E Test') {
            steps {
                dir('frontend') {
                    bat 'npm.cmd install'
                    bat 'npx.cmd playwright install'
                    bat 'npx.cmd playwright test'
                }
            }
        }

        stage('Deploy') {
            steps {
                bat '"C:\\Users\\Hp\\AppData\\Local\\Programs\\DockerDesktop\\resources\\bin\\docker-compose.exe" -p task-manage up -d --force-recreate --remove-orphans'
            }
        }

    }

    post {
        success {
            echo 'Pipeline Success'
        }

        failure {
            echo 'Pipeline Failed'
        }
    }
}