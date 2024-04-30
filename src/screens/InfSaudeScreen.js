// InfSaude.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  Platform,
} from "react-native";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "../config/firebaseConfig";
import RNPickerSelect from "react-native-picker-select";
import * as ImagePicker from "expo-image-picker";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { collection, getDocs } from "firebase/firestore";
import { Picker } from "@react-native-picker/picker";

const auth = getAuth();

const InfSaudeScreen = (props) => {
  const [userData, setUserData] = useState({
    race: "",
    bloodType: "",
    isOrganDonor: false,
    hasDiabetes: false,
    hasHypertension: false,
    hadHeartAttack: false,
    hadStroke: false,
    takesControlledMedication: false,
    profileImageUrl: "",
    height: "",
    weight: "",
  });

  const [userId, setUserId] = useState("");
  const [availableBloodTypes, setAvailableBloodTypes] = useState([]);
  const [date, setDate] = useState(new Date()); // Estado para gerenciar a data
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [availableRaces, setAvailableRaces] = useState([]);
  const { navigation } = props;
  const [selectedRace, setSelectedRace] = useState("");
  // Função para mostrar o DateTimePicker
  const showDatePicker = () => {
    setIsDatePickerVisible(true);
  };

  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setIsDatePickerVisible(Platform.OS === "ios"); // Esconda o DatePicker para Android após a seleção
    setDate(currentDate); // Atualize o estado 'date' com a nova data
    setUserData({
      ...userData,
      birthDate: currentDate.toLocaleDateString("pt-BR"), // Atualize a data de nascimento no estado 'userData'
    });
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
      if (authUser) {
        setUserId(authUser.uid); // Atualize o userId aqui
        fetchUserProfile(authUser.uid);
      } else {
        console.log("Nenhum usuário autenticado.");
        // Aqui você pode tratar o que acontece se não houver usuário autenticado.
      }
    });
    fetchRaces();
    fetchBloodTypes();

    return () => {
      unsubscribeAuth();
    };
  }, []);

  useEffect(() => {
    let isMounted = true; // Adiciona um flag para verificar se o componente está montado

    const fetchUserProfile = async (uid) => {
      const userRef = doc(db, "users", uid);
      try {
        const userSnap = await getDoc(userRef);
        if (userSnap.exists() && isMounted) {
          const userProfileData = userSnap.data();
          const birthDate = userProfileData.birthDate.toDate
            ? userProfileData.birthDate.toDate()
            : new Date();

          // Defina a raça para o valor correto baseado nos dados carregados
          const userRaceValue = userProfileData.race;

          // Atualize o estado com os dados do perfil do usuário
          setUserData({
            ...userProfileData,
            birthDate: birthDate.toLocaleDateString("pt-BR"),
            race: userRaceValue,
          });

          // Atualize a seleção da raça baseada no valor correspondente da coleção de raças
          const matchingRace = availableRaces.find(
            (race) => race.label === userRaceValue
          );
          setSelectedRace(matchingRace ? matchingRace.value : "");

          setDate(birthDate);
        }
      } catch (error) {
        console.error("Erro ao buscar perfil do usuário:", error);
        Alert.alert("Erro ao buscar perfil", error.message);
      }
    };

    if (auth.currentUser && availableRaces.length > 0) {
      fetchUserProfile(auth.currentUser.uid);
    }

    // Cleanup function para evitar atualizações de estado em componentes desmontados
    return () => {
      isMounted = false;
    };
  }, [auth.currentUser, availableRaces]);

  const onRaceChange = (value) => {
    setUserData({ ...userData, race: value });
  };

  const fetchBloodTypes = async () => {
    setAvailableBloodTypes(["A+", "O-", "B+", "AB+", "AB-", "O+", "B-"]);
  };

  const fetchRaces = async () => {
    const raceCollectionRef = collection(db, "race");
    try {
      const raceSnapshot = await getDocs(raceCollectionRef);
      const races = raceSnapshot.docs.map((doc) => ({
        label: doc.data().Cor,
        value: doc.id,
      }));
      setAvailableRaces(races);
    } catch (error) {
      console.error("Erro ao buscar raças:", error);
      Alert.alert("Erro ao buscar raças", error.message);
    }
  };

  const onBloodTypeChange = (itemValue) => {
    setUserData({ ...userData, bloodType: itemValue });
  };

  const fetchUserProfile = async (uid) => {
    const userRef = doc(db, "users", uid);
    try {
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userProfileData = userSnap.data();
        const birthDate = userProfileData.birthDate.toDate
          ? userProfileData.birthDate.toDate()
          : new Date();

        const raceValue = availableRaces.find(
          (race) => race.label === userProfileData.race
        )?.value;

        setUserData({
          ...userProfileData, // Dados recuperados do Firestore
          birthDate: birthDate.toLocaleDateString("pt-BR"), // Data de nascimento formatada
          race: raceValue || "", // Use o valor correspondente encontrado
        });

        setDate(birthDate);
      } else {
        console.error("Usuário não encontrado.");
        Alert.alert("Erro", "Perfil do usuário não encontrado.");
      }
    } catch (error) {
      console.error("Erro ao buscar perfil do usuário:", error);
      Alert.alert("Erro ao buscar perfil", error.message);
    }
  };

  function converterDataParaISO(dataString) {
    const partes = dataString.split("/");
    if (partes.length !== 3) {
      throw new Error("Formato de data inválido");
    }
    const [dia, mes, ano] = partes;
    return `${ano}-${mes}-${dia}`;
  }

  const [isSaving, setIsSaving] = useState(false); // Adiciona um estado para o indicador de carregamento.

  const handleSaveProfile = async () => {
    if (!userId) {
      Alert.alert("Erro", "ID do usuário não definido.");
      return;
    }

    setIsSaving(true);

    try {
      const birthDateParts = userData.birthDate.split("/");
      const birthDateObj = new Date(
        birthDateParts[2],
        birthDateParts[1] - 1,
        birthDateParts[0]
      );

      // Verificar se a data de nascimento é válida
      if (isNaN(birthDateObj.getTime())) {
        throw new Error("Data de nascimento inválida");
      }

      // Ajustar o horário para o início do dia para evitar problemas de fuso horário
      birthDateObj.setHours(0, 0, 0, 0);

      // Encontrar o label da raça com base no valor selecionado
      const raceLabel = availableRaces.find(
        (race) => race.value === userData.race
      )?.label;

      // Se a raça selecionada não estiver disponível, lance um erro
      if (!raceLabel) {
        throw new Error("Raça selecionada não é válida");
      }

      // Atualizar o documento do usuário no Firestore
      await updateDoc(doc(db, "users", userId), {
        ...userData,
        birthDate: Timestamp.fromDate(birthDateObj), // Salvar a data como Timestamp
        race: raceLabel, // Salvar o label da raça
      });

      Alert.alert("Sucesso", "Perfil atualizado com sucesso.");
    } catch (error) {
      console.error("Erro ao salvar perfil:", error);
      Alert.alert("Erro", "Falha ao salvar o perfil: " + error.message);
    } finally {
      setIsSaving(false); // Desativar o indicador de carregamento
    }
  };

  const handleTextChange = (text, field) => {
    setUserData({ ...userData, [field]: text });
  };
  // Substitua 'default_avatar.png' pelo caminho para a sua imagem padrão
  const defaultAvatar = Image.resolveAssetSource(
    require("../assets/perfil/profile-pic.svg")
  ).uri;

  const handleImagePick = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    // Verifique se a seleção não foi cancelada e se a matriz 'assets' está presente
    if (!result.canceled && result.assets) {
      // Supondo que só haja uma imagem selecionada, pegue o primeiro item da matriz 'assets'
      const image = result.assets[0];

      // Agora você pode usar 'image.uri' para acessar o URI da imagem selecionada
      if (image.uri) {
        uploadImage(image.uri);
      }
    }
  };

  // Função para lidar com a mudança dos Switches
  const handleSwitchChange = (value, field) => {
    setUserData({ ...userData, [field]: value });
  };

  const uploadImage = async (uri) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const storageRef = ref(getStorage(), `profile_images/${userId}.jpg`);
      await uploadBytes(storageRef, blob);

      const downloadUrl = await getDownloadURL(storageRef);
      setUserData({ ...userData, profileImageUrl: downloadUrl });
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        // Deslogou com sucesso, redirecione para a tela de login
        navigation.reset({
          index: 0,
          routes: [{ name: "Login" }], // O nome 'Login' deve corresponder ao nome da rota definida no Stack.Navigator
        });
      })
      .catch((error) => {
        // Houve um erro no logout
        Alert.alert("Erro ao sair", error.message);
      });
  };
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer} >    
      <View style={styles.infoContainer}>
        <Text style={styles.label}>Cor</Text>
        <RNPickerSelect
          onValueChange={(value) => {
            setSelectedRace(value);
            setUserData({ ...userData, race: value });
          }}
          items={availableRaces.map((race) => ({
            label: race.label,
            value: race.value,
          }))}
          style={pickerSelectStyles}
          value={selectedRace} // Use o estado selectedRace aqui
          placeholder={{ label: "Selecione uma cor...", value: null }}
        />
        <Text style={styles.label}>Tipo Sanguíneo</Text>
        <RNPickerSelect
          onValueChange={(value) => handleTextChange(value, "bloodType")}
          items={availableBloodTypes.map((bt) => ({ label: bt, value: bt }))}
          style={pickerSelectStyles}
          value={userData.bloodType}
          useNativeAndroidPickerStyle={false} // desativa o estilo nativo do picker no Android
        />

        <Text style={styles.label}>Altura</Text>
        <TextInput
          style={styles.input}
          value={userData.height}
          onChangeText={(text) => handleTextChange(text, "height")}
        />
        <Text style={styles.label}>Peso(KG)</Text>
        <TextInput
          style={styles.input}
          value={userData.weight}
          onChangeText={(text) => handleTextChange(text, "weight")}
        />

        <Text style={styles.label}>Diabetes?</Text>
        <Switch
          value={userData.hasDiabetes}
          onValueChange={(value) => handleSwitchChange(value, "hasDiabetes")}
        />

        <Text style={styles.label}>Pressão Alta?</Text>
        <Switch
          value={userData.hasHypertension}
          onValueChange={(value) =>
            handleSwitchChange(value, "hasHypertension")
          }
        />

        <Text style={styles.label}>Teve Infarto?</Text>
        <Switch
          value={userData.hadHeartAttack}
          onValueChange={(value) => handleSwitchChange(value, "hadHeartAttack")}
        />

        <Text style={styles.label}>Teve AVC?</Text>
        <Switch
          value={userData.hadStroke}
          onValueChange={(value) => handleSwitchChange(value, "hadStroke")}
        />

        <Text style={styles.label}>Toma Medicamento Controlado?</Text>
        <Switch
          value={userData.takesControlledMedication}
          onValueChange={(value) =>
            handleSwitchChange(value, "takesControlledMedication")
          }
        />

        <Text style={styles.label}>Doador de Órgãos?</Text>
        <Switch
          value={userData.isOrganDonor}
          onValueChange={(value) => handleSwitchChange(value, "isOrganDonor")}
        />

        <TouchableOpacity style={styles.button} onPress={handleSaveProfile}>
          <Text style={styles.buttonText}>Salvar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 4,
    color: "black",
    paddingRight: 30,
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 0.5,
    borderColor: "purple",
    borderRadius: 8,
    color: "black",
    paddingRight: 30, // para garantir que o texto não fique escondido atrás do ícone
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  contentContainer: {
    alignItems: "center", // Agora isso é aplicado corretamente
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
    borderColor: "gray",
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#007bff",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 20,
  },
  pickerContainer: {
    marginVertical: 20, // Adiciona espaço vertical
    width: "100%", // Ocupa toda a largura
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 10,
  },
  picker: {
    height: 50, // Ajuste a altura conforme necessário
    width: "100%",
    // Outros estilos que você possa querer adicionar
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
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
  calendarIcon: {
    width: 20,
    height: 20,
  },
  logoutButton: {
    backgroundColor: "red", // Cor do botão de logout
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 20,
  },
  logoutButtonText: {
    color: "white", // Cor do texto dentro do botão de logout
    fontSize: 16,
    fontWeight: "bold",
  },
});


export default InfSaudeScreen;
