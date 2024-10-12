import React, { useState } from "react";
import {
  View,
  Alert,
  TouchableOpacity,
  Text,
  TextInput,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { auth, db } from "../config/firebaseConfig";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import Logo from "../components/Logo";
import DateTimePickerModal from "react-native-modal-datetime-picker";

const RegisterScreen = () => {
  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState(new Date());
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);

  const handleConfirmDate = (date) => {
    setBirthDate(date);
    setIsDatePickerVisible(false);
  };

  const handleRegister = () => {
    if (password !== confirmPassword) {
      Alert.alert("Erro", "As senhas não correspondem.");
      return;
    }

    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        sendEmailVerification(user).then(() => {
          Alert.alert(
            "Verifique seu e-mail",
            "Um e-mail de verificação foi enviado. Por favor, verifique sua caixa de entrada."
          );
          setFullName("");
          setBirthDate(new Date());
          setEmail("");
          setPassword("");
          setConfirmPassword("");
          setIsDatePickerVisible(false);
          // Navega de volta para a tela de login (caso esteja utilizando react-navigation)
          // navigation.navigate("Login");
        });

        const birthDateTimestamp = Timestamp.fromDate(birthDate);
        setDoc(doc(db, "users", userCredential.user.uid), {
          fullName,
          birthDate: birthDateTimestamp,
        }).then(() => {
          // Sucesso no cadastro
        });
      })
      .catch((error) => {
        Alert.alert("Erro", error.message);
      });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View style={styles.container}>
          <Logo width={200} height={200} />
          <Text style={styles.label}>Nome Completo</Text>
          <TextInput
            style={styles.input}
            placeholder="Nome Completo"
            value={fullName}
            onChangeText={setFullName}
          />
          <Text style={styles.label}>Data de Nascimento</Text>
          <TouchableOpacity
            style={styles.datePickerInput}
            onPress={() => setIsDatePickerVisible(true)}
          >
            <Text style={styles.datePickerText}>
              {birthDate.toLocaleDateString()}
            </Text>
          </TouchableOpacity>
          <DateTimePickerModal
            isVisible={isDatePickerVisible}
            mode="date"
            onConfirm={handleConfirmDate}
            onCancel={() => setIsDatePickerVisible(false)}
            date={birthDate}
            textColor="black" // Adiciona cor ao texto
          />
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />
          <Text style={styles.label}>Senha</Text>
          <TextInput
            style={styles.input}
            placeholder="Senha"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <Text style={styles.label}>Confirme a Senha</Text>
          <TextInput
            style={styles.input}
            placeholder="Confirme a Senha"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
          <TouchableOpacity style={styles.button} onPress={handleRegister}>
            <Text style={styles.buttonText}>Cadastrar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f7f7f7",
  },
  input: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    marginTop: 12,
    padding: 10,
    borderRadius: 4,
  },
  button: {
    backgroundColor: "#007bff",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 12,
    alignSelf: "center",
    width: "80%",
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 20,
  },
  datePickerInput: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 4,
    padding: 10,
    marginTop: 8,
  },
  datePickerText: {
    fontSize: 16,
  },
});

export default RegisterScreen;
