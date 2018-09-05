#pragma once

struct DataFile {
	const char* positionDataFilename;
	
	DataFile(const char* position, float scale = 1.0f) : positionDataFilename(position) {}
};

namespace {
	const int numFiles = 7;
    const char* files[numFiles] = {"walking.csv", "squats.csv", "kicks.csv", "monkey.csv", "yoga_warrior.csv", "crouch.csv", "bend_forward.csv"};
	int currentFile = 0;
	
	const float nearNull = 0.0001f;
	const int width = 1024;
	const int height = 768;

	const bool renderRoom = true;
	const bool renderTrackerAndController = true;
	const bool renderAxisForEndEffector = false;
	
	const bool withOrientation = true;
	const float errorMaxPos = 0.01f;
	const float errorMaxRot = 0.01f;
	
	bool logData = false;
	
    // Evaluation values
    const bool eval = false;
    float evalStep = 0.05f;
    int evalSteps = 21;
    int evalFilesInGroup = 4;
	int evalStepsInit = evalSteps;
	float evalInitValue[] = { 0.01f,    0.01f,      0.21f,      0.36f,      0.21f,      0.01f   };
	
	// IK Parameter
	int ikMode = 0;
	float lambda[] =    { 0.35f,	0.05f,		0.20f,		0.25f,		0.20f,		0.018f	};
	float dMaxPos[] =   { 0,        0,          0,          0,          0,          0       };
	float dMaxRot[] =   { 0,        0,          0,          0,          0,          0       };
	float maxSteps[] =  { 100.0f,   100.0f,     100.0f,     100.0f,     100.0f,     100.0f  };
}
