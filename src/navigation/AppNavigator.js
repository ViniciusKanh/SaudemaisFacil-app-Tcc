//AppNavigator.js
import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Image,
  TouchableOpacity,
  View,
  Text,
  Modal,
  Button,
} from "react-native";
import { getAuth, signOut } from "firebase/auth";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native"; // Importe useNavigation
import HomeScreen from "../screens/HomeScreen";
import PerfilScreen from "../screens/PerfilScreen";
import DCNTScreen from "../screens/DCNT/DCNT";
import MedicalPrescriptionScreen from "../screens/medicalPrescriptionScreen";
import InformationSaudeScreen from "../screens/InformationSaudeScreen";
import InfoSaudePGScreen from "../screens/InfoSaudePG";
import MedicationScreen from "../screens/MedicationScreen";
import DadosSaudeSaudeScreen from "../screens/InfSaudeScreen";
import LembretesScreen from "../screens/Lembretes/LembretesScreen";
import RelRemindersConsultationScreen from "./../screens/Lembretes/Consulta/RelRemindersConsultationScreen";
import AuthNavigator from "./AuthNavigator";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons"; // ou qualquer outra biblioteca de ícones que preferir


const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const AppNavigator = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [userProfileImageUrl, setUserProfileImageUrl] = useState("");
  const auth = getAuth();
  const storage = getStorage();

  const placeholderImage = require("../assets/perfil/profile-pic.jpg"); // Caminho para a imagem padrão
  // Hook para obter o objeto de navegação
  const navigation = useNavigation();

  useEffect(() => {
    if (auth.currentUser) {
      const userImageRef = ref(
        storage,
        `profile_images/${auth.currentUser.uid}.jpg`
      );
      getDownloadURL(userImageRef)
        .then((url) => {
          // Use um estado para armazenar o URL da imagem
          setUserProfileImageUrl(url);
          // Armazena o URL em cache para uso futuro
          Image.prefetch(url);
        })
        .catch(() => {
          // Se não encontrar a imagem, pode usar uma imagem padrão.
          setUserProfileImageUrl(
            Image.resolveAssetSource(placeholderImage).uri
          );
        });
    }
  }, [auth.currentUser]);

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        // Deslogou com sucesso, redirecione para o AuthNavigator
        // Isso irá automaticamente levar o usuário para a primeira tela dentro do AuthNavigator, que é a tela de Login
        navigation.reset({
          index: 0,
          routes: [{ name: "Auth" }], // Aqui você está resetando para o AuthNavigator
        });
        setModalVisible(false);
      })
      .catch((error) => {
        // Houve um erro no logout
        Alert.alert("Erro ao sair", error.message);
      });
  };

  // Defina a função navigateToScreen
  const navigateToScreen = (screenName) => {
    navigation.navigate(screenName);
    setModalVisible(false); // Feche o modal após a navegação
  };

  const getHeaderRight = (routeName) => {
    if (routeName === "Login" || routeName === "Register") {
      return null; // Não exibe nada para a tela de Login e Registro
    } else {
      return () => (
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Image
            source={
              userProfileImageUrl
                ? { uri: userProfileImageUrl }
                : placeholderImage
            }
            style={styles.profilePic}
          />
        </TouchableOpacity>
      );
    }
  };

  function BottomTabNavigator() {
    const [modalVisible, setModalVisible] = useState(false);

    return (
      <>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName;

              if (route.name === "Home") {
                iconName = focused ? "home" : "home-outline";
              } else if (route.name === "Profile") {
                iconName = focused ? "person" : "person-outline";
              } else if (route.name === "Medicamentos") {
                iconName = focused ? "medkit" : "medkit-outline";
              } else if (route.name === "Lembretes") {
                iconName = focused ? "alarm" : "alarm-outline";
              } else if (route.name === "Saúde") {
                iconName = focused ? "heart" : "heart-outline";
              }
              // Você pode continuar adicionando mais "else if" para outras telas

              return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: "green",
            tabBarInactiveTintColor: "gray",
            headerStyle: {
              backgroundColor: "#65BF85",
              height: 115,
            },
            headerTintColor: "#fff",
            headerTitleStyle: {
              fontWeight: "bold",
              fontSize: 25,
            },
            headerRight: () =>
              route.name !== "Login" && route.name !== "Register" ? (
                <TouchableOpacity onPress={() => setModalVisible(true)}>
                <Image
                  source={{ uri: userProfileImageUrl || Image.resolveAssetSource(placeholderImage).uri }}
                  style={styles.profilePic}
                />
              </TouchableOpacity>
              ) : null,
            tabBarStyle: { paddingBottom: 45, height: 100 }, // Ajuste conforme necessário
          })}
        >
          <Tab.Screen name="Home" component={HomeScreen} />
          <Tab.Screen name="Profile" component={PerfilScreen} />
          <Tab.Screen name="Medicamentos" component={MedicationScreen} />
          <Tab.Screen name="Lembretes" component={LembretesScreen} />
          <Tab.Screen name="Saúde" component={InformationSaudeScreen} />
          {/* Adicione mais Tab.Screen para outras telas que desejar */}
        </Tab.Navigator>
        <Stack.Screen
          name="Auth"
          component={AuthNavigator}
          options={{ headerShown: false }}
        />

        {/* Modal para logout */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <Text style={styles.modalTitle}>Escolha uma Opção</Text>
              {/* Botões de navegação */}
             
              {/* Botões de ação */}
              <TouchableOpacity
                style={[styles.buttonStyle, styles.logoutButton]}
                onPress={handleLogout}
              >
                <Text style={styles.buttonText}>Logout</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.buttonStyle, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </>
    );
  }

  return (
    <>
<Stack.Navigator
  screenOptions={({ route }) => ({
    headerStyle: {
      backgroundColor: "#65BF85",
      height: 150 // Ajuste a altura aqui
    },
    headerTintColor: "#fff",
    headerTitleStyle: {
      fontWeight: "bold"
    }
  })}
>
        {/* Stack.Screen para Login, Register, Home, e outras telas */}
        <Stack.Screen
          name="Auth"
          component={AuthNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Menu"
          component={BottomTabNavigator}
          options={{
            headerShown: false, // Substitua '#FFF' pela cor desejada
          }}
        />
        <Stack.Screen name="Dados Pessoais" component={PerfilScreen} />
        <Stack.Screen name="Pressão / Diabetes" component={DCNTScreen} />
        <Stack.Screen name="Receitas" component={MedicalPrescriptionScreen} />
        <Stack.Screen name="Perfil" component={InformationSaudeScreen} />
        <Stack.Screen name="Histórico" component={InfoSaudePGScreen} />
        <Stack.Screen name="Medicamentos" component={MedicationScreen} />
        <Stack.Screen
          name="Informações Saúde"
          component={DadosSaudeSaudeScreen}
        />
        <Stack.Screen name="Lembretes" component={LembretesScreen} />
        <Stack.Screen
          name="Consultas"
          component={RelRemindersConsultationScreen}
        />
        {/* ... outras telas ... */}
      </Stack.Navigator>

      {/* Modal para logout */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Escolha uma Opção</Text>
            {/* Botões de navegação */}
            <TouchableOpacity
              style={styles.buttonStyle}
              onPress={() => navigateToScreen("Perfil")}
            >
              <Text style={styles.buttonText}>Dados Pessoais</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.buttonStyle}
              onPress={() => navigateToScreen("Informações Saúde")}
            >
              <Text style={styles.buttonText}>Informações de Saúde</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.buttonStyle}
              onPress={() => navigateToScreen("Medicamentos")}
            >
              <Text style={styles.buttonText}>Gestão de Medicamentos</Text>
            </TouchableOpacity>
            {/* Botões de ação */}
            <TouchableOpacity
              style={[styles.buttonStyle, styles.logoutButton]}
              onPress={handleLogout}
            >
              <Text style={styles.buttonText}>Logout</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.buttonStyle, styles.cancelButton]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)", // Fundo semi-transparente
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    width: "80%", // Tamanho do modal
  },
  modalTitle: {
    marginBottom: 15,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  buttonStyle: {
    backgroundColor: "#65BF85", // Cor verde para botões de navegação
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    width: "100%", // Botões ocupam a largura total do modal
    alignItems: "center",
    marginVertical: 5, // Espaçamento vertical
  },
  logoutButton: {
    backgroundColor: "#ff6347", // Cor vermelha para o logout
    marginTop: 20, // Espaço extra acima do botão de logout
  },
  cancelButton: {
    backgroundColor: "#6c757d", // Cor cinza para o cancelar
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 16,
  },
  profilePicTAB: {
    width: 60, // Ajuste a largura conforme necessário
    height: 60, // Ajuste a altura conforme necessário
    borderRadius: 25, // Isso fará a imagem circular
    marginRight: 10,
  },
  profilePic: {
    width: 65,
    height: 65,
    borderRadius: 30,
    marginRight: 10,
  },
});

export default AppNavigator;
