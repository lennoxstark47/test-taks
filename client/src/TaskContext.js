import React, { createContext, useContext, useReducer, useEffect } from 'react';
import io from 'socket.io-client';
import axios from 'axios';

const TaskContext = createContext();

// Action types
const TASK_ACTIONS = {
    SET_TASKS: 'SET_TASKS',
    ADD_TASK: 'ADD_TASK',
    UPDATE_TASK: 'UPDATE_TASK',
    DELETE_TASK: 'DELETE_TASK',
    SET_LOADING: 'SET_LOADING',
    SET_ERROR: 'SET_ERROR',
    SET_CONNECTED: 'SET_CONNECTED'
};

// Initial state
const initialState = {
    tasks: [],
    loading: false,
    error: null,
    connected: false
};

// Reducer
const taskReducer = (state, action) => {
    switch (action.type) {
        case TASK_ACTIONS.SET_TASKS:
            return { ...state, tasks: action.payload, loading: false };

        case TASK_ACTIONS.ADD_TASK:
            return { ...state, tasks: [action.payload, ...state.tasks] };

        case TASK_ACTIONS.UPDATE_TASK:
            return {
                ...state,
                tasks: state.tasks.map(task =>
                    task._id === action.payload.taskId
                        ? { ...task, ...action.payload.updates }
                        : task
                )
            };

        case TASK_ACTIONS.DELETE_TASK:
            return {
                ...state,
                tasks: state.tasks.filter(task => task._id !== action.payload)
            };

        case TASK_ACTIONS.SET_LOADING:
            return { ...state, loading: action.payload };

        case TASK_ACTIONS.SET_ERROR:
            return { ...state, error: action.payload, loading: false };

        case TASK_ACTIONS.SET_CONNECTED:
            return { ...state, connected: action.payload };

        default:
            return state;
    }
};

// API base URL
const API_BASE_URL = 'http://localhost:5000/api';

// Context Provider
export const TaskProvider = ({ children }) => {
    const [state, dispatch] = useReducer(taskReducer, initialState);

    useEffect(() => {
        // Initialize socket connection
        const socket = io('http://localhost:5000');

        socket.on('connect', () => {
            console.log('Connected to server');
            dispatch({ type: TASK_ACTIONS.SET_CONNECTED, payload: true });
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from server');
            dispatch({ type: TASK_ACTIONS.SET_CONNECTED, payload: false });
        });

        // Listen for new tasks
        socket.on('newTask', (task) => {
            dispatch({ type: TASK_ACTIONS.ADD_TASK, payload: task });
        });

        // Listen for task updates
        socket.on('taskUpdate', ({ taskId, status, result, task }) => {
            const updates = { status };
            if (result) updates.result = result;
            if (task) {
                // If we have the full task object, use it
                dispatch({ type: TASK_ACTIONS.UPDATE_TASK, payload: { taskId, updates: task } });
            } else {
                dispatch({ type: TASK_ACTIONS.UPDATE_TASK, payload: { taskId, updates } });
            }
        });

        // Listen for task deletions
        socket.on('taskDeleted', (taskId) => {
            dispatch({ type: TASK_ACTIONS.DELETE_TASK, payload: taskId });
        });

        // Load initial tasks
        loadTasks();

        return () => {
            socket.disconnect();
        };
    }, []);

    // Load tasks from API
    const loadTasks = async () => {
        try {
            dispatch({ type: TASK_ACTIONS.SET_LOADING, payload: true });
            const response = await axios.get(`${API_BASE_URL}/tasks`);
            dispatch({ type: TASK_ACTIONS.SET_TASKS, payload: response.data });
        } catch (error) {
            dispatch({ type: TASK_ACTIONS.SET_ERROR, payload: error.message });
        }
    };

    // Create new task
    const createTask = async (title) => {
        try {
            dispatch({ type: TASK_ACTIONS.SET_ERROR, payload: null });
            await axios.post(`${API_BASE_URL}/tasks`, { title });
            // Task will be added via socket event
        } catch (error) {
            dispatch({ type: TASK_ACTIONS.SET_ERROR, payload: error.message });
        }
    };

    // Delete task
    const deleteTask = async (taskId) => {
        try {
            await axios.delete(`${API_BASE_URL}/tasks/${taskId}`);
            // Task will be removed via socket event
        } catch (error) {
            dispatch({ type: TASK_ACTIONS.SET_ERROR, payload: error.message });
        }
    };

    const value = {
        ...state,
        createTask,
        deleteTask,
        loadTasks
    };

    return (
        <TaskContext.Provider value={value}>
            {children}
        </TaskContext.Provider>
    );
};

// Hook to use the context
export const useTask = () => {
    const context = useContext(TaskContext);
    if (!context) {
        throw new Error('useTask must be used within a TaskProvider');
    }
    return context;
};