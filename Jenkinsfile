// 手工触发的前端 CI：使用已有 Linux ARM64 节点，仅测试、构建与归档，不部署线上。
pipeline {
    agent { label 'linux && arm64' }

    // 控制历史产物数量、并发构建与最长运行时间，避免工作区互相干扰。
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
        // npm ci 严格使用锁文件；测试通过后才进入生产构建。
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
        // 只在成功时归档静态构建，不把源码、依赖或工作区作为网站发布。
        success {
            archiveArtifacts artifacts: 'dist-refactor/**', fingerprint: true
        }
        // 清理的是本次 Jenkins 工作区，不是 Mac mini 已部署的静态目录。
        cleanup {
            deleteDir()
        }
    }
}
