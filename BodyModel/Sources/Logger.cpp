#include "pch.h"
#include "Logger.h"

#include <Kore/Log.h>

#include <iostream>
#include <string>
#include <ctime>

namespace {
	bool initHmmAnalysisData = false;
}

Logger::Logger() {
}

Logger::~Logger() {
	logDataReader.close();
	logdataWriter.close();
	hmmWriter.close();
	hmmAnalysisWriter.close();
}

void Logger::startLogger(const char* filename) {
	time_t t = time(0);   // Get time now
	
	char logFileName[50];
	sprintf(logFileName, "%s_%li.csv", filename, t);
	
	logdataWriter.open(logFileName, std::ios::app); // Append to the end
	
	// Append header
	logdataWriter << "tag rawPosX rawPosY rawPosZ rawRotX rawRotY rawRotZ rawRotW scale\n";
	logdataWriter.flush();
	
	log(Kore::Info, "Start logging");
}

void Logger::endLogger() {
	logdataWriter.close();
	
	log(Kore::Info, "Stop logging");
}

void Logger::saveData(const char* tag, Kore::vec3 rawPos, Kore::Quaternion rawRot, float scale) {
	// Save position and rotation
	logdataWriter << tag << " " << rawPos.x() << " " << rawPos.y() << " " << rawPos.z() << " " << rawRot.x << " " << rawRot.y << " " << rawRot.z << " " << rawRot.w << " " << scale << "\n";
	logdataWriter.flush();
}

void Logger::startHMMLogger(const char* filename, int num) {
	char logFileName[50];
	sprintf(logFileName, "%s_%i.csv", filename, num);
	
	hmmWriter.open(logFileName, std::ios::out);
	
	// Append header
	char hmmHeader[] = "tag time posX posY posZ rotX rotY rotZ rotW\n";
	hmmWriter << hmmHeader;
	hmmWriter.flush();
	
	log(Kore::Info, "Start logging data for HMM");
}

void Logger::endHMMLogger() {
	hmmWriter.flush();
	hmmWriter.close();
	
	log(Kore::Info, "Stop logging data for HMM");
}

void Logger::saveHMMData(const char* tag, float lastTime, Kore::vec3 pos, Kore::Quaternion rot) {
	// Save position
	hmmWriter << tag << " " << lastTime << " "  << pos.x() << " " << pos.y() << " " << pos.z() << " " << rot.x << " " << rot.y << " " << rot.z << " " << rot.y << "\n";
	hmmWriter.flush();
}

void Logger::analyseHMM(const char* hmmName, double probability, bool newLine) {
	if (!initHmmAnalysisData) {
		char hmmAnalysisPath[100];
		strcat(hmmAnalysisPath, hmmName);
		strcat(hmmAnalysisPath, "_analysis.txt");
		hmmAnalysisWriter.open(hmmAnalysisPath, std::ios::out | std::ios::app);
		initHmmAnalysisData = true;
	}
	
	if (newLine) hmmAnalysisWriter << "\n";
	else hmmAnalysisWriter << probability << " ";
	
	hmmAnalysisWriter.flush();
}

void Logger::startEvaluationLogger(const char* filename, int ikMode, float lambda, float errorMaxPos, float errorMaxRot, int maxSteps) {
	time_t t = time(0);   // Get time now
	
	char evaluationDataPath[100];
	sprintf(evaluationDataPath, "eval/evaluationData_%li.csv", t);
	
	char evaluationConfigPath[100];
	sprintf(evaluationConfigPath, "eval/evaluationConfig_%li.csv", t);
	
	evaluationConfigOutputFile.open(evaluationConfigPath, std::ios::app);
	evaluationConfigOutputFile << "IK Mode;File;Lambda;Error Pos Max;Error Rot Max;Steps Max\n";
	evaluationConfigOutputFile << ikMode << ";" << filename << ";" << lambda << ";" << errorMaxPos << ";" << errorMaxRot << ";" << maxSteps << "\n";
	evaluationConfigOutputFile.flush();
	evaluationConfigOutputFile.close();
	
	evaluationDataOutputFile.open(evaluationDataPath, std::ios::app);
	evaluationDataOutputFile << "Iterations;Error Pos;Error Rot;Error;Time [us];Time/Iteration [us];";
	evaluationDataOutputFile << "Iterations Min;Error Pos Min;Error Rot Min;Error Min;Time [us] Min;Time/Iteration [us] Min;";
	evaluationDataOutputFile << "Iterations Max;Error Pos Max;Error Rot Max;Error Max;Time [us] Max;Time/Iteration [us] Max;";
	evaluationDataOutputFile << "Reached [%];Stucked [%]\n";
	evaluationDataOutputFile.flush();
	
	log(Kore::Info, "Start eval-logging!");
}

void Logger::endEvaluationLogger() {
	evaluationDataOutputFile.close();
	
	log(Kore::Info, "Stop eval-logging!");
}

void Logger::saveEvaluationData(Avatar *avatar) {
	float* iterations = avatar->getIterations();
	float* errorPos = avatar->getErrorPos();
	float* errorRot = avatar->getErrorRot();
	float* time = avatar->getTime();
	float* timeIteration = avatar->getTimeIteration();
	
	// Save datas
	for (int i = 0; i < 3; ++i) {
		float error = sqrtf(Square(*(errorPos + i)) + Square(*(errorRot + i)));
		
		evaluationDataOutputFile << *(iterations + i) << ";";
		evaluationDataOutputFile << *(errorPos + i) << ";";
		evaluationDataOutputFile << *(errorRot + i) << ";";
		evaluationDataOutputFile << error << ";";
		evaluationDataOutputFile << *(time + i) << ";";
		evaluationDataOutputFile << *(timeIteration + i) << ";";
	}
	evaluationDataOutputFile << avatar->getReached() << ";" << avatar->getStucked() << "\n";
	evaluationDataOutputFile.flush();
}

bool Logger::readData(const int numOfEndEffectors, const char* filename, Kore::vec3* rawPos, Kore::Quaternion* rawRot, float& scale) {
	string tag;
	float posX, posY, posZ;
	float rotX, rotY, rotZ, rotW;
	
	if(!logDataReader.is_open()) {
		
		if (ifstream(filename)) {
			logDataReader.open(filename);
			log(Kore::Info, "Read data from %s", filename);
			
			// Skip header
			logDataReader >> tag >> tag >> tag >> tag >> tag >> tag >> tag >> tag >> tag;
		} else {
			log(Kore::Info, "Could not find file %s", filename);
		}
	}
	
	// Read lines
	for (int i = 0; i < numOfEndEffectors; ++i) {
		logDataReader >> tag >> posX >> posY >> posZ >> rotX >> rotY >> rotZ >> rotW >> scale;
		
		rawPos[i] = Kore::vec3(posX, posY, posZ);
		rawRot[i] = Kore::Quaternion(rotX, rotY, rotZ, rotW);
		
		if (logDataReader.eof()) {
			logDataReader.close();
			return false;
		}
	}
	
	return true;
}
