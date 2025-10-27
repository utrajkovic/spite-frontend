// import { Injectable } from '@angular/core';
// import { Workout, Exercise } from './models';

// @Injectable({
//   providedIn: 'root'
// })
// export class WorkoutService {
//   private exercises: Exercise[] = [
//     {
//       id: 1,
//       name: 'Push-Ups',
//       description: 'Klasični sklekovi za grudi i triceps.',
//       sets: 3,
//       reps: '10',
//       restBetweenSets: 60,   
//       restAfterExercise: 180,
//       videoUrl: 'assets/videos/Push-Ups.mp4'
//     },
//     {
//       id: 2,
//       name: 'Pull-Ups',
//       description: 'Podizi telo rukama dok visis',
//       sets: 3,
//       reps: '8',
//       restBetweenSets: 90,
//       restAfterExercise: 180,
//       videoUrl: 'assets/videos/Pull-Ups.mp4'
//     },
//     {
//       id: 3,
//       name: 'Squats',
//       description: 'Čučnjevi za noge i gluteus.',
//       sets: 3,
//       reps: '12',
//       restBetweenSets: 60,
//       restAfterExercise: 180,
//       videoUrl: 'assets/videos/Pull-Ups.mp4'
//     },
//     {
//       id: 4,
//       name: 'Lunges',
//       description: 'Iskoraci za noge i ravnotežu.',
//       sets: 3,
//       reps: '12',
//       restBetweenSets: 60,
//       restAfterExercise: 180
//     },
//     {
//       id: 5,
//       name: 'Warm up',
//       description: 'Radi kombinacije sklekova, skokova cucnjeva u zavisnosti koji deo tela radis',
//       sets: 3,
//       reps: '10',
//       restBetweenSets: 30,
//       restAfterExercise: 90,
//       videoUrl: 'assets/videos/Plyo-Push-Up.mp4'
//     },
//     {
//       id: 6,
//       name: 'Plyo Push-Ups',
//       description: 'Odguraj svoje telo prilikom podizanja i zameni ruku koja je na platformi',
//       sets: 3,
//       reps: '10',
//       restBetweenSets: 60,
//       restAfterExercise: 180,
//       videoUrl: 'assets/videos/Plyo-Push-Up.mp4'
//     },
//     {
//       id: 7,
//       name: 'Dumbell Row',
//       description: 'Iz pozicije skleka veslaj jednom bucicom dok je druga ruka na zamlji',
//       sets: 3,
//       reps: '10',
//       restBetweenSets: 60,
//       restAfterExercise: 180,
//       videoUrl: 'assets/videos/Dumbel-Row.mp4'
//     },
//     {
//       id: 8,
//       name: 'Lunge dumbell rise',
//       description: 'U jednoj ruci drzi bucicu i prilikom podizanja iz iskoraka podigni bucicu iznad glave',
//       sets: 3,
//       reps: '10',
//       restBetweenSets: 60,
//       restAfterExercise: 180,
//       videoUrl: 'assets/videos/Lunge-Dumbel-Rise.mp4'
//     },
//     {
//       id: 9,
//       name: 'Chest press hip thrust',
//       description: 'Lezeci ledjima na pod drzi noge u vazduhu, kod podizes bucice tako nogama podizes kukove',
//       sets: 3,
//       reps: '10',
//       restBetweenSets: 60,
//       restAfterExercise: 180,
//       videoUrl: 'assets/videos/Chest-Press-Hip-Thrust.mp4'
//     }
//     ,
//     {
//       id: 10,
//       name: 'One leg standing row',
//       description: 'Dok stojis na jednoj nozi i nagnes telo blago napred, suprotnom rukom veslas sa bucicom',
//       sets: 3,
//       reps: '10',
//       restBetweenSets: 60,
//       restAfterExercise: 180,
//       videoUrl: 'assets/videos/One-Leg-Standing-Row.mp4'
//     },
//     {
//       id: 11,
//       name: 'One leg standing shoulder press',
//       description: 'Dok stojis na jednoj nozi podizes bucicu u vis i rotiras je',
//       sets: 3,
//       reps: '10',
//       restBetweenSets: 60,
//       restAfterExercise: 180,
//       videoUrl: 'assets/videos/One-Leg-Shoulder-Press.mp4'
//     },
//     {
//       id: 12,
//       name: 'Unilateral floor chest press',
//       description: 'Dok leis na ledjima sa nogama na podu gurajuci kukove gore podizes jednu bucicu dok je suprotna noga u vazduhu',
//       sets: 3,
//       reps: '10',
//       restBetweenSets: 60,
//       restAfterExercise: 180,
//       videoUrl: 'assets/videos/Unilateral-Floor-Chest-Press.mp4'
//     },
//     {
//       id: 13,
//       name: 'Core rotations',
//       description: 'Drzeci teg ispruzenim rukama rotiraj telo u jednu i drugu stranu',
//       sets: 3,
//       reps: '12',
//       restBetweenSets: 60,
//       restAfterExercise: 180,
//       videoUrl: 'assets/videos/Core-Rotations.mp4'
//     },
//     {
//       id: 14,
//       name: 'Barbell Squats',
//       description: 'Cucanj sa sipkom',
//       sets: 3,
//       reps: '8',
//       restBetweenSets: 60,
//       restAfterExercise: 180,
//       videoUrl: 'assets/videos/Squats.mp4'
//     },
//     {
//       id: 15,
//       name: 'Barbell Reverse Lunge',
//       description: 'Iskorak unazad',
//       sets: 3,
//       reps: '8',
//       restBetweenSets: 60,
//       restAfterExercise: 180,
//       videoUrl: 'assets/videos/Barbell-Reverse-Lunges.mp4'
//     },
//     {
//       id: 16,
//       name: 'Landmine Rotation',
//       description: 'Rotiraj telo prilikom podizanja sipke, preuzmi i guraj suprotnom rukom',
//       sets: 3,
//       reps: '6',
//       restBetweenSets: 60,
//       restAfterExercise: 180,
//       videoUrl: 'assets/videos/Landmine-Rotation.mp4'
//     },
//     {
//       id: 17,
//       name: 'High Weighted Skipp',
//       description: 'Visoki skip sa opterecenjem',
//       sets: 3,
//       reps: '20s',
//       restBetweenSets: 60,
//       restAfterExercise: 180,
//       videoUrl: 'assets/videos/High-Weighted-Skipp.mp4'
//     },
//     {
//       id: 18,
//       name: 'Landmine Lateral Lunges',
//       description: 'Iskorak na stranu sa sipkom',
//       sets: 3,
//       reps: '6',
//       restBetweenSets: 60,
//       restAfterExercise: 180,
//       videoUrl: 'assets/videos/Landmine-Lateral-Lunges.mp4'
//     },
//     {
//       id: 19,
//       name: 'Landmine Explosive Drill',
//       description: 'Eksplozivni jednorucni izbacaj sa promenom',
//       sets: 3,
//       reps: '12',
//       restBetweenSets: 60,
//       restAfterExercise: 180,
//       videoUrl: 'assets/videos/Landmine-Explosive-Drill.mp4'
//     },
//     {
//       id: 20,
//       name: 'Landmine Shoulder Press',
//       description: 'Jednorucni potisak ramena ',
//       sets: 3,
//       reps: '8',
//       restBetweenSets: 60,
//       restAfterExercise: 180,
//       videoUrl: 'assets/videos/Landmine-Shoulder-Press.mp4'
//     }
//   ];

//   // lista treninga (povezuje se sa vežbama preko exerciseIds)
//   private workouts: Workout[] = [
//     {
//       id: 1,
//       title: 'Upper Body 1',
//       subtitle: 'Strength, Plyo',
//       content: 'Fokus na grudi, ramena, ruke i ledja',
//       exerciseIds: [5, 6, 7, 8, 9, 10, 11, 12, 2, 13] 
//     },
//     {
//       id: 2,
//       title: 'Full Body',
//       subtitle: 'Strength, Plyo',
//       content: 'Kombinacija svih grupa mišića za potpuni trening.',
//       exerciseIds: [14, 15, 16, 17, 18, 19, 20, 2, 1] 
//     },
//         {
//       id: 3,
//       title: 'Core',
//       subtitle: 'Cardio',
//       content: 'Intenzivne vežbe za sagorevanje i stabilnost trupa.',
//       exerciseIds: [5, 6]
//     },
//     {
//       id: 4,
//       title: 'Full Body',
//       subtitle: 'Mixed',
//       content: 'Kombinacija svih grupa mišića za potpuni trening.',
//       exerciseIds: [1, 3, 5]
//     }
//   ];

//   getAllWorkouts(): Workout[] {
//     return this.workouts;
//   }

//   getWorkoutById(id: number): Workout | undefined {
//     return this.workouts.find(w => w.id === id);
//   }

//   getExercisesByIds(ids: number[]): Exercise[] {
//    return ids
//      .map(id => this.exercises.find(e => e.id === id))
//       .filter((e): e is Exercise => !!e); 
//   }
//   getAllExercises(): Exercise[] {
//     return this.exercises;
//   }

//   addExercise(newExercise: Omit<Exercise, 'id'>) {
//     const newId = this.exercises.length + 1;
//     this.exercises.push({ id: newId, ...newExercise });
//   }

//   addWorkoutFromForm(formValue: any) {
//     const newId = this.workouts.length + 1;
//     const exerciseIds = formValue.exercises.map((e: any) => e.exerciseId);

//     this.workouts.push({
//       id: newId,
//       title: formValue.title,
//       subtitle: formValue.subtitle,
//       content: formValue.content,
//       exerciseIds
//     });
//   }
//   deleteWorkout(id: number) {
//     this.workouts = this.workouts.filter(w => w.id !== id);
//   }

// }

