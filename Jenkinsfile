pipeline {
    agent { label 'linux && arm64' }

    options {
        buildDiscarder(logRotator(numToKeepStr: '20', artifactNumToKeepStr: '10'))
        disableConcurrentBuilds()
        timeout(time: 20, unit: 'MINUTES')
    }

    stages {
        stage('Environment') {
            steps {
                sh 'node --version && npm --version'
            }
        }
        stage('Install') {
            steps {
                sh 'npm ci'
            }
        }
        stage('Test') {
            steps {
                sh 'npm test'
            }
        }
        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }
    }

    post {
        success {
            archiveArtifacts artifacts: 'dist-refactor/**', fingerprint: true
        }
        cleanup {
            deleteDir()
        }
    }
}
