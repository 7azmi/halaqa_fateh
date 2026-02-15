'use client';

import { useState } from 'react';
import { useStudents, useTeachers } from '@/lib/hooks/use-data';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Plus, User, BookOpen, GraduationCap, Filter, UserMinus } from 'lucide-react';
import { StudentFormDialog } from './student-form-dialog';
import { StudentDetailsSheet } from './student-details-sheet';
import type { Student } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function StudentList() {
  const { data: students, isLoading, error } = useStudents();
  const { data: teachers } = useTeachers();
  const [search, setSearch] = useState('');
  const [teacherFilter, setTeacherFilter] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const filteredStudents = students?.filter(student => {
    const matchesSearch = student.name.includes(search) || 
      student.current_surah.includes(search);
    const matchesTeacher = teacherFilter === 'all' || 
      student.teacher_id === teacherFilter;
    return matchesSearch && matchesTeacher;
  }) || [];

  // Group by teacher
  const groupedByTeacher = filteredStudents.reduce((acc, student) => {
    const teacherName = student.teacher?.name || 'بدون معلم';
    if (!acc[teacherName]) acc[teacherName] = [];
    acc[teacherName].push(student);
    return acc;
  }, {} as Record<string, Student[]>);

  if (error) {
    return (
      <div className="p-4 text-center text-destructive">
        <p>حدث خطأ في تحميل البيانات</p>
        <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-20">
      {/* Search and Filters */}
      <div className="sticky top-[76px] z-30 bg-background p-4 -mx-4 border-b border-border">
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="بحث عن طالب..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-9"
            />
          </div>
          <Button onClick={() => setShowAddDialog(true)} size="icon">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={teacherFilter} onValueChange={setTeacherFilter}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="جميع المعلمين" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع المعلمين</SelectItem>
              {teachers?.map(teacher => (
                <SelectItem key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 px-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">{students?.length || 0}</p>
              <p className="text-xs text-muted-foreground">طالب نشط</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-accent/20 border-accent/30">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 bg-accent/30 rounded-lg">
              <GraduationCap className="w-5 h-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-accent-foreground">{teachers?.length || 0}</p>
              <p className="text-xs text-muted-foreground">معلم</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Student List */}
      <div className="px-4 space-y-4">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-12">
            <UserMinus className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">لا يوجد طلاب</p>
            <Button 
              variant="link" 
              onClick={() => setShowAddDialog(true)}
              className="mt-2"
            >
              إضافة طالب جديد
            </Button>
          </div>
        ) : (
          Object.entries(groupedByTeacher).map(([teacherName, teacherStudents]) => (
            <div key={teacherName}>
              <div className="flex items-center gap-2 mb-2">
                <GraduationCap className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-medium text-muted-foreground">
                  {teacherName} ({teacherStudents.length})
                </h3>
              </div>
              <div className="space-y-2">
                {teacherStudents.map(student => (
                  <Card 
                    key={student.id} 
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setSelectedStudent(student)}
                  >
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{student.name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{student.age} سنة</span>
                          <span>•</span>
                          <BookOpen className="w-3 h-3" />
                          <span className="truncate">{student.current_surah}</span>
                        </div>
                      </div>
                      <Badge variant="secondary" className="shrink-0">
                        {student.current_surah}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <StudentFormDialog 
        open={showAddDialog} 
        onOpenChange={setShowAddDialog}
        teachers={teachers || []}
      />

      <StudentDetailsSheet
        student={selectedStudent}
        onClose={() => setSelectedStudent(null)}
        teachers={teachers || []}
      />
    </div>
  );
}
