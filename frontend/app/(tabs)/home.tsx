import { StyleSheet, Text, View } from "react-native";

export default function Index() {
  return (
    <View
      style={styles.container}
    >
      <Text style={styles.content}>Home</Text>
    </View>
  );
}


const styles = StyleSheet.create({
  container:{
    flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "blue"
  },
  content:{
    fontSize: 30,
    color: "white"

  }
});