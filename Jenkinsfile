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
                bat 'docker compose build'
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