import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  Platform,
} from "react-native";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "../config/firebaseConfig";
import * as ImagePicker from "expo-image-picker";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import DateTimePickerModal from "react-native-modal-datetime-picker";

const calendarIcon = require("../assets/icones/calendario.png");
const defaultAvatar = require("../assets/perfil/profile-pic.jpg"); // Certifique-se de que o caminho esteja correto

const auth = getAuth();
const PerfilScreen = (props) => {
  const [userData, setUserData] = useState({
    fullName: "",
    birthDate: new Date(),
    email: "",
    phoneNumber: "",
    profileImageUrl: "",
  });
  const [date, setDate] = useState(new Date());
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchUserProfile(user.uid);
      } else {
        console.log("Nenhum usuário autenticado.");
      }
    });

    return unsubscribeAuth;
  }, []);

  const fetchUserProfile = async (uid) => {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      let data = docSnap.data();
      let formattedDate = data.birthDate
        ? new Date(data.birthDate.seconds * 1000)
        : new Date();
      setUserData({
        ...data,
        birthDate: formattedDate,
        email: auth.currentUser?.email || "",
      });
      setDate(formattedDate);
    } else {
      console.log("No such document!");
    }
  };

  const handleSaveProfile = async () => {
    const userId = auth.currentUser ? auth.currentUser.uid : null;
    if (!userId) {
      Alert.alert("Erro", "ID do usuário não definido.");
      return;
    }

    try {
      const birthDateTimestamp = Timestamp.fromDate(userData.birthDate);

      await updateDoc(doc(db, "users", userId), {
        fullName: userData.fullName,
        birthDate: birthDateTimestamp,
        phoneNumber: userData.phoneNumber,
      });

      Alert.alert("Sucesso", "Perfil atualizado com sucesso.");
    } catch (error) {
      console.error("Erro ao salvar perfil:", error);
      Alert.alert("Erro", "Falha ao salvar o perfil: " + error.message);
    }
  };

  const handleDateChange = (selectedDate) => {
    setIsDatePickerVisible(false);
    if (selectedDate) {
      setDate(selectedDate);
      setUserData({ ...userData, birthDate: selectedDate });
    }
  };

  const handleImagePick = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets) {
      const image = result.assets[0];
      if (image.uri) {
        uploadImage(image.uri);
      }
    }
  };

  const uploadImage = async (uri) => {
    const userId = auth.currentUser ? auth.currentUser.uid : null;
    if (!userId) {
      console.error("Não foi possível encontrar o ID do usuário.");
      return;
    }
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const storageRef = ref(getStorage(), `profile_images/${userId}.jpg`);
      await uploadBytes(storageRef, blob);

      const downloadUrl = await getDownloadURL(storageRef);
      setUserData({ ...userData, profileImageUrl: downloadUrl });

      await updateDoc(doc(db, "users", userId), {
        profileImageUrl: downloadUrl,
      });

      Alert.alert("Imagem do perfil atualizada com sucesso.");
    } catch (e) {
      console.error("Erro ao fazer upload da imagem: ", e);
      Alert.alert("Erro ao atualizar a imagem do perfil", e.message);
    }
  };

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: "Login" }],
        });
      })
      .catch((error) => {
        Alert.alert("Erro ao sair", error.message);
      });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <TouchableOpacity
        style={styles.profileImageContainer}
        onPress={handleImagePick}
      >
        <Image
          style={styles.profileImage}
          source={{ uri: userData.profileImageUrl || defaultAvatar }}
        />
      </TouchableOpacity>
      <View style={styles.infoContainer}>
        <Text style={styles.label}>Nome</Text>
        <TextInput
          style={styles.input}
          value={userData.fullName}
          onChangeText={(text) => setUserData({ ...userData, fullName: text })}
        />
        <Text style={styles.label}>Data de Nascimento</Text>
        <TouchableOpacity
          style={styles.datePickerInput}
          onPress={() => setIsDatePickerVisible(true)}
        >
          <Text style={styles.datePickerText}>
            {userData.birthDate ? userData.birthDate.toLocaleDateString() : "Selecionar Data"}
          </Text>
        </TouchableOpacity>
        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="date"
          onConfirm={handleDateChange}
          onCancel={() => setIsDatePickerVisible(false)}
          date={date}
          textColor="black" // Adiciona cor ao texto
        />
        <Text style={styles.label}>E-mail</Text>
        <TextInput
          style={styles.input}
          value={auth.currentUser ? auth.currentUser.email : ""}
          editable={false}
        />
        <Text style={styles.label}>Telefone de Contato</Text>
        <TextInput
          style={styles.input}
          value={userData.phoneNumber}
          onChangeText={(text) =>
            setUserData({ ...userData, phoneNumber: text })
          }
        />
        <TouchableOpacity style={styles.button} onPress={handleSaveProfile}>
          <Text style={styles.buttonText}>Salvar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  contentContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  profileImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: "gray",
    marginTop: 20,
    overflow: "hidden",
  },
  profileImage: {
    width: "100%",
    height: "100%",
  },
  infoContainer: {
    paddingHorizontal: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#65BF85",
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#00D315",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    color: "black",
    fontSize: 16,
    fontWeight: "bold",
  },
  datePickerInput: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#65BF85",
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
  },
  datePickerText: {
    fontSize: 16,
  },
  calendarIcon: {
    width: 20,
    height: 20,
  },
  logoutButton: {
    backgroundColor: "red",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  logoutButtonText: {
    color: "black",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default PerfilScreen;
