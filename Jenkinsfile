pipeline {
    agent any

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
                bat 'C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker-compose.exe build'
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