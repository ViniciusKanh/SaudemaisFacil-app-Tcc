import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Image,
  ScrollView,
  FlatList,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native"; // Certifique-se de importar useRoute também
import { Picker } from "@react-native-picker/picker";
import {
  CapsuleIcon,
  PillIcon,
  PoteIcon,
  ComprimidoRetangularIcon,
  InjecaoIcon,
  AdesivoIcon,
  CremeIcon,
  SprayIcon,
} from "./FormsMedications"; // Importando os ícones

const colors = [
  "#FF0000",
  "#00FF00",
  "#0000FF",
  "#FFFF00",
  "#00FFFF",
  "#FFFFFF",
  "#000000",
  "#808080",
  "#800000",
  "#808000",
  "#008000",
  "#800080",
  "#008080",
  "#000080",
  "#40E0D0",
  "#FF7F50",
  "#FFEBCD",
  "#EE82EE",
];

const MedicationScreen = () => {
  const navigation = useNavigation();
  const [currentStep, setCurrentStep] = useState(1);
  const [medicationName, setMedicationName] = useState("");
  const [medicationType, setMedicationType] = useState("");
  const [medicationDosage, setMedicationDosage] = useState(""); // Defina um valor inicial para testar
  const [TypemedicationDosage, setTypemedicationDosage] = useState(""); // Defina um valor inicial para testar
  const [medicationForm, setMedicationForm] = useState("Pill"); // Inicializa com 'Pill', mas isso deve ser definido em passos anteriores
  const [selectedColor, setSelectedColor] = useState("#000000");
  const [backgroundColor, setBackgroundColor] = useState("#FFFFFF"); // Inicializando com branco

  const handleNext = () => {
    // Verifica as condições para os passos iniciais
    if (
      (currentStep === 1 && medicationName) ||
      (currentStep === 2 && medicationType) ||
      (currentStep === 3 && medicationDosage && TypemedicationDosage)
    ) {
      setCurrentStep(currentStep + 1);
    }
    // Verifica se a forma do medicamento foi selecionada
    else if (currentStep === 4 && medicationForm) {
      setCurrentStep(currentStep + 1); // Avança para a etapa de seleção de cor
    }
  };

  const IconComponents = {
    Pill: PillIcon,
    Capsule: CapsuleIcon,
    Potinho: PoteIcon,
    ComprimidoRetangular: ComprimidoRetangularIcon,
    Injecao: InjecaoIcon,
    Adesivo: AdesivoIcon,
    Cream: CremeIcon,
    Spray: SprayIcon,

    // Adicione outros ícones conforme necessário
  };

  const SelectedIcon = IconComponents[medicationForm];

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFormSelection = (form) => {
    setMedicationForm(form);
  };

  const handleDosageChange = (dosage) => {
    setMedicationDosage(dosage);
  };

  const handleColorSelection = (color) => {
    setSelectedColor(color);
  };

  const handleSave = () => {
    console.log("Saving", {
      medicationName,
      medicationType,
      medicationDosage,
      medicationForm,
    });
    navigation.goBack();
  };

  const icons = {
    Pill: require("../assets/icons/pill.png"),
    Capsule: require("../assets/icons/capsule.png"),
    Liquid: require("../assets/icons/liquid.png"),
    Topical: require("../assets/icons/patch.png"),
    Spray: require("../assets/icons/liquid.png"),
    Powder: require("../assets/icons/pill.png"),
    Patch: require("../assets/icons/patch.png"),
    Injection: require("../assets/icons/capsule.png"),
    // Adicione mais conforme necessário
  };

  return (
    <ScrollView>
      <View style={styles.container}>
        {currentStep === 1 && (
          <View style={styles.container}>
            <View style={styles.header}>
              <Image
                source={require("../assets/icons/pill.png")}
                style={styles.logo}
              />
              <Text style={styles.headerText}>Nome do Medicamento</Text>
            </View>
            <TextInput
              style={styles.input}
              value={medicationName}
              onChangeText={setMedicationName}
              placeholder="Digite o nome do medicamento"
            />
            <TouchableOpacity
              style={[styles.button, !medicationName && styles.buttonDisabled]}
              onPress={handleNext}
              disabled={!medicationName}
            >
              <Text style={styles.buttonText}>Próximo</Text>
            </TouchableOpacity>
            {currentStep > 1 && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={handlePrevious}
              >
                <Text style={styles.buttonText}>Voltar</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        {currentStep === 2 && (
          <View style={styles.step}>
            <Text style={styles.medicationLabel}>{medicationName}</Text>
            <Image
              source={require("../assets/icons/capsule.png")}
              style={styles.logo}
            />
            <Text style={styles.headerText}>Escolha o Tipo de Medicamento</Text>
            <ScrollView contentContainerStyle={styles.scrollView}>
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionHeader}>Formas Comuns</Text>
                {["Cápsula", "Comprimido", "Líquido", "Tópico"].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={styles.optionButton}
                    onPress={() => setMedicationType(type)}
                  >
                    <Text style={styles.optionText}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionHeader}>Mais Formas</Text>
                {[
                  "Adesivo",
                  "Creme",
                  "Dispositivo",
                  "Espuma",
                  "Gel",
                  "Gotas",
                  "Inalador",
                  "Injeção",
                  "Loção",
                  "Pomada",
                  "Pó",
                  "Spray",
                  "Supositório",
                ].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={styles.optionButton}
                    onPress={() => setMedicationType(type)}
                  >
                    <Text style={styles.optionText}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                style={[
                  styles.button,
                  !medicationType && styles.buttonDisabled,
                ]}
                onPress={handleNext}
                disabled={!medicationType}
              >
                <Text style={styles.buttonText}>Próximo</Text>
              </TouchableOpacity>
              {currentStep > 1 && (
                <TouchableOpacity
                  style={styles.button}
                  onPress={handlePrevious}
                >
                  <Text style={styles.buttonText}>Voltar</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        )}

        {currentStep === 3 && (
          <View style={styles.step}>
            <View style={styles.stepContainer}>
              <Text style={styles.medicationLabel}>
                {`${medicationName} - ${medicationType}, ${medicationDosage} ${TypemedicationDosage}`}
              </Text>
              <Image
                source={require("../assets/icons/liquid.png")}
                style={styles.logo}
              />
              <Text style={styles.headerText}>
                Adicione a Intensidade do Medicamento
              </Text>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Intensidade</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={medicationDosage}
                  onChangeText={handleDosageChange}
                  placeholder="Digite a intensidade"
                  editable={true}
                />
              </View>
              <View style={styles.pickerContainer}>
                <Text style={styles.labelTipo}>Escolha a Unidade</Text>
                <Picker
                  selectedValue={TypemedicationDosage}
                  onValueChange={(itemValue, itemIndex) =>
                    setTypemedicationDosage(itemValue)
                  }
                  style={styles.picker}
                >
                  {["mg", "mcg", "g", "mL", "%"].map((unit) => (
                    <Picker.Item key={unit} label={unit} value={unit} />
                  ))}
                </Picker>
              </View>

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[
                    styles.button,
                    !(medicationDosage && TypemedicationDosage) &&
                      styles.buttonDisabled,
                  ]}
                  onPress={handleNext}
                  disabled={!(medicationDosage && TypemedicationDosage)}
                >
                  <Text style={styles.buttonText}>Seguinte</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={handlePrevious}
                >
                  <Text style={styles.buttonText}>Voltar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {currentStep === 4 && (
          <View style={styles.container}>
            <Image
              source={require("../assets/icons/forms.png")}
              style={styles.logo}
            />
            <View style={styles.header}>
              <Text style={styles.medicationLabel}>
                {medicationName} - {medicationType}, {medicationDosage}{" "}
                {TypemedicationDosage}, {medicationForm}
              </Text>
              <Text style={styles.headerText}>Escolha a Forma</Text>
            </View>
            <View style={styles.gridContainer}>
              <TouchableOpacity
                style={styles.gridItem}
                onPress={() => handleFormSelection("Capsule")}
              >
                <CapsuleIcon color="#007bff" size={50} />
                <Text style={styles.gridLabel}>Cápsula</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.gridItem}
                onPress={() => setMedicationForm("Pill")}
              >
                <PillIcon color="#007bff" size={50} />

                <Text style={styles.gridLabel}>Comprimido</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.gridItem}
                onPress={() => setMedicationForm("Potinho")}
              >
                <PoteIcon color="#007bff" size={50} />
                <Text style={styles.gridLabel}>Pote de Remédio</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.gridItem}
                onPress={() => setMedicationForm("ComprimidoRetangular")}
              >
                <ComprimidoRetangularIcon color="#007bff" size={50} />
                <Text style={styles.gridLabel}>Comprimido Retangulo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.gridItem}
                onPress={() => setMedicationForm("Injecao")}
              >
                <InjecaoIcon color="#007bff" size={50} />
                <Text style={styles.gridLabel}>Siringa de Injeção</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.gridItem}
                onPress={() => setMedicationForm("Adesivo")}
              >
                <AdesivoIcon color="#007bff" size={50} />
                <Text style={styles.gridLabel}>Adesivo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.gridItem}
                onPress={() => setMedicationForm("Cream")}
              >
                <CremeIcon color="#007bff" size={50} />
                <Text style={styles.gridLabel}>Creme</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.gridItem}
                onPress={() => setMedicationForm("Spray")}
              >
                <SprayIcon color="#007bff" size={50} />
                <Text style={styles.gridLabel}>Spray</Text>
              </TouchableOpacity>
              {/* Adicione mais opções conforme necessário */}
            </View>
            <TouchableOpacity
              style={[styles.button, !medicationForm && styles.buttonDisabled]}
              onPress={handleNext}
              disabled={!medicationForm}
            >
              <Text style={styles.buttonText}>Seguinte</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handlePrevious}
            >
              <Text style={styles.buttonText}>Voltar</Text>
            </TouchableOpacity>
          </View>
        )}

        {currentStep === 5 && (
          <View style={styles.steps}>
            <Image
              source={require("../assets/icons/color.png")}
              style={styles.logo}
            />
            <Text style={styles.headerText}>Escolha as Cores do Remédio</Text>

            <View style={[styles.iconContainer, { backgroundColor }]}>
              {SelectedIcon && (
                <SelectedIcon color={selectedColor} size={100} />
              )}
            </View>

            <Text style={styles.subHeaderText}>Cor do Ícone:</Text>
            <View style={styles.colorGrid}>
              {colors.map((color, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.colorOption, { backgroundColor: color }]}
                  onPress={() => setSelectedColor(color)}
                />
              ))}
            </View>

            <Text style={styles.subHeaderText}>Cor de Fundo:</Text>
            <View style={styles.colorGrid}>
              {colors.map((color, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.colorOption, { backgroundColor: color }]}
                  onPress={() => setBackgroundColor(color)}
                />
              ))}
            </View>
              <TouchableOpacity
                style={styles.button}
                onPress={() => setCurrentStep(currentStep + 1)}
              >
                <Text style={styles.buttonText}>Confirmar Cores</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.backButton}
                onPress={handlePrevious}
              >
                <Text style={styles.buttonText}>Voltar</Text>
              </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    backgroundColor: "#fff",
    paddingTop: 20,
  },
  steps: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: "contain",
    alignSelf: "center",
    marginBottom: 20,
  },
  headerText: {
    fontSize: 28, // Aumentando o tamanho para mais visibilidade
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  sectionContainer: {
    backgroundColor: "#f7f7f7",
    borderRadius: 10,
    padding: 10,
    marginVertical: 10,
    width: "100%",
    alignSelf: "center",
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  optionButton: {
    paddingVertical: 15,
    width: "100%",
    paddingHorizontal: 10,
    backgroundColor: "#e6e6e6",
    borderRadius: 5,
    marginVertical: 5,
  },
  optionText: {
    fontSize: 20,
    color: "#333",
  },
  picker: {
    width: "100%",
    height: 50,
    color: "#000", // Tornando o texto mais escuro para melhorar a visibilidade
  },
  medicationLabel: {
    fontSize: 22, // Tamanho da label do nome do medicamento
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 40,
  },
  addButton: {
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 5,
    margin: 10,
  },
  addButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  scrollView: {
    backgroundColor: "white",
    marginHorizontal: 20,
  },
  modalContent: {
    padding: 20,
  },
  stepContainer: {
    alignItems: "center",
    padding: 20,
  },
  label: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  labelTipo: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: -65,
  },
  icon: {
    width: 50,
    height: 50,
    margin: 10,
  },
  saveButton: {
    backgroundColor: "#28a745",
    padding: 10,
    borderRadius: 5,
  },
  navigationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  navButton: {
    padding: 10,
    backgroundColor: "#007bff",
    borderRadius: 5,
  },
  navButtonText: {
    color: "white",
    fontSize: 16,
  },
  inputContainer: {
    width: "100%",
    marginBottom: 10,
  },
  input: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    padding: 10,
    marginVertical: 10,
    width: "100%", // Garanta que a largura esteja correta
  },
  backButton: {
    backgroundColor: "#007bff",
    padding: 15,
    borderRadius: 5,
    width: "90%",
    alignItems: "center",
    marginTop: 20,
  },
  pickerContainer: {
    width: "100%",
    marginBottom: 50,
  },
  buttonContainer: {
    width: "100%", // Define a largura para cobrir toda a largura do container pai
    alignItems: "center", // Centraliza os botões horizontalmente
    marginTop: 100, // Adiciona espaço acima do container de botões
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
    color: "#666", // Ajusta a cor do texto para melhor contraste
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    padding: 10,
  },
  gridItem: {
    width: "20%", // Ajuste conforme necessário para seu layout
    justifyContent: "center",
    alignItems: "center",
    margin: 5,
    padding: 10,
  },
  gridIcon: {
    width: 50,
    height: 50,
    resizeMode: "contain",
  },
  gridLabel: {
    fontSize: 12,
    textAlign: "center",
  },
  iconButton: {
    alignItems: "center",
    margin: 10,
  },
  iconText: {
    marginTop: 5,
  },
  iconPreview: {
    width: 120,
    height: 120,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 60,
    marginBottom: 20,
    flexDirection: "row",
    resizeMode: "contain",
  },
  iconContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    marginBottom: 20,
  },
  colorCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    margin: 5,
  },
  subHeaderText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
    textTransform: "uppercase", // Aumenta a visibilidade do cabeçalho
    textDecorationLine: "underline", // Sublinha o texto para destacar
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 20,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    margin: 5,
    borderWidth: 1, // Adiciona borda preta para cada círculo de cor
    borderColor: "#000", // Cor da borda
  },
  button: {
    backgroundColor: "#007bff",
    padding: 15,
    borderRadius: 5,
    width: "90%",
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default MedicationScreen;
