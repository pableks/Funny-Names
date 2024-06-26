import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import { Input } from "@/components/ui/input";
import { ThemeProvider } from "@/components/theme-provider";
import { ModeToggle } from './components/mode-toggle';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { z } from 'zod';

interface Student {
  id: number;
  name: string;
  username: string;
}

const studentSchema = z.object({
  name: z.string().max(100, 'Name should not exceed 100 characters'),
  username: z.string().min(1, 'Username is required').max(100, 'Username should not exceed 100 characters'),
});

function App() {
  const [students, setStudents] = useState<Student[]>([]);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentUsername, setNewStudentUsername] = useState('');
  const [nameError, setNameError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [remainingChances, setRemainingChances] = useState(() => {
    const storedChances = localStorage.getItem('remainingChances');
    return storedChances ? parseInt(storedChances, 10) : 5;
  });

  useEffect(() => {
    localStorage.setItem('remainingChances', remainingChances.toString());
  }, [remainingChances]);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await axios.get<Student[]>('https://teaching-dingo-central.ngrok-free.app/students', {
        headers: {
          'ngrok-skip-browser-warning': 'true',
        },
      });
      setStudents(response.data);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  if (remainingChances <= 0) {
    setNameError('You have exceeded the maximum number of chances.');
    return;
  }
  try {
    const validatedData = studentSchema.parse({ name: newStudentName, username: newStudentUsername });
    setNameError('');
    setUsernameError('');
    await axios.post(
      'https://teaching-dingo-central.ngrok-free.app/students',
      // Send the entire validatedData object which includes both name and username
      validatedData,
      {
        headers: {
          'ngrok-skip-browser-warning': 'true',
        },
      }
    );
    setNewStudentName('');
    setNewStudentUsername('');
    fetchStudents();
    setRemainingChances((prevChances) => {
      const updatedChances = prevChances - 1;
      localStorage.setItem('remainingChances', updatedChances.toString());
      return updatedChances;
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const nameIssue = error.issues.find((issue) => issue.path[0] === 'name');
      const usernameIssue = error.issues.find((issue) => issue.path[0] === 'username');
      setNameError(nameIssue?.message || '');
      setUsernameError(usernameIssue?.message || '');
    } else {
      console.error('Error adding student:', error);
    }
  }
};

  const isSubmitDisabled = newStudentUsername.trim() === '' || remainingChances <= 0;

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="flex justify-between items-center pb-4">
        <div className="relative">
          <h1 className="text-4xl font-bold mb-4 transition duration-300 ease-in-out hover:scale-110">
            Funny Names
       
            
            
            <Badge variant="secondary"> <div className='text-lg font-bold'>by pblks</div> <div className='pl-1'>  | off until future updates</div></Badge>
          </h1> 
          
          <div className="absolute top-0 right-0 transform -translate-y-1/2 translate-x-1/2 pl-2 h-4 w-4">
            <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></div>
            <div className="relative inline-flex rounded-full h-4 w-4 bg-sky-500"></div>
          </div>
        </div>
        <ModeToggle />
      </div>
      <div className="App">
        <form onSubmit={handleSubmit} className="flex flex-col">
          <Input
            type="text"
            placeholder="Ingresa el nombre"
            value={newStudentName}
            onChange={(e) => setNewStudentName(e.target.value)}
            className="mr-2 mb-2"
          />
          {nameError && <p className="text-red-500 text-sm mt-1">{nameError}</p>}
          <Input
            type="text"
            placeholder="Hazte responsable e ingresa un nombre de usuario"
            value={newStudentUsername}
            onChange={(e) => setNewStudentUsername(e.target.value)}
            className="mr-2 mb-2"
          />
          {usernameError && <p className="text-red-500 text-sm mt-1">{usernameError}</p>}
          <Button type="submit" disabled={isSubmitDisabled}>
            Agregar nombre
          </Button>
        </form>
        <Badge variant="outline" className="mt-4">
          Intentos Restantes: {remainingChances}
        </Badge>
        <Card className="mt-4 pt-2">
          <CardContent>
            <ul className="text-lg">
              {students.map((student) => (
                <li key={student.id}>
                  <strong>
                    <Badge variant="secondary">{student.username}:</Badge>
                  </strong>{' '}
                  {student.name}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Button onClick={fetchStudents} className="mt-4">
          Refresh
        </Button>
      </div>
    </ThemeProvider>
  );
}

export default App;