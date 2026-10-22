import { Theme } from "@/constants/theme";
import { useState } from "react";
import {
  Text,
  TextInput,
  View,
  StyleSheet,
  type TextInputChangeEvent,
  Pressable,
} from "react-native";

type TaskRegisterProps = {
  onRegister: (taskName: string) => void;
};

export function TaskRegister({ onRegister }: TaskRegisterProps) {
  const [title, setTitle] = useState("");

  function onTextUpdate(text: string) {
    //console.log("Text updated:", text);
    setTitle(text);
  }

  function onChangeEvent(event: TextInputChangeEvent) {
    //console.log("Change event:", event);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Task Register</Text>
      <Text>Du skrev {title}</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter task name"
        value={title}
        onChangeText={onTextUpdate}
        onChange={onChangeEvent}
      />
      <Pressable style={styles.button} onPress={() => onRegister(title)}>
        <Text style={styles.buttonText}>Register Task</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Theme.spacing.sm,
    padding: Theme.spacing.lg,
    backgroundColor: Theme.background,
  },
  title: {
    fontSize: Theme.fontSize.lg,
    fontWeight: "bold",
    color: Theme.text,
  },
  input: {
    borderWidth: 1,
    borderColor: "gray",
    padding: 8,
  },
  button: {
    backgroundColor: Theme.primary,
    padding: 12,
    borderRadius: 4,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
});
