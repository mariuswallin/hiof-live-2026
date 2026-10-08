import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";
import { students } from ".";

export default function StudentDetailScreen() {
  const { studentId } = useLocalSearchParams();

  const student = students.find((s) => s.id === studentId);
  console.log(studentId, student);

  return (
    <View>
      <Text>Student siden</Text>
      <Text>{JSON.stringify(studentId)}</Text>
      <Text>{JSON.stringify(student)}</Text>
    </View>
  );
}
