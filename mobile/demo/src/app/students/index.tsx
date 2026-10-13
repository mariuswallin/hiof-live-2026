import { Link } from "expo-router";
import { Text, View } from "react-native";

export const students = [
  { id: "123", name: "Aaron" },
  { id: "345", name: "Tina" },
  { id: "890", name: "Nafisa" },
  { id: "999", name: "Oscar" },
  { id: "1337", name: "Aleks" },
];

export default function StudentsScreen() {
  return (
    <View>
      <Text>Students Screen</Text>
      {students.map((student) => (
        <Link key={student.id} href={`/students/${student.id}`}>
          <Text>Student {student.name}</Text>
        </Link>
      ))}
    </View>
  );
}
