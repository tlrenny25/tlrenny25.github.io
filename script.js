function convertTextToHex() {
  const text = document.getElementById("input").value;
  let hexOutput = "";

  for (let i = 0; i < text.length; i++) {
    hexOutput += text.charCodeAt(i).toString(16);
  }

  document.getElementById("output").innerText = hexOutput || "No text entered!";
}

function convertHexToText() {
  const hexString = document.getElementById("input").value.trim();
  let output = "";

  try {
    const cleanHex = hexString.replace(/\s+/g, '');
    for (let i = 0; i < cleanHex.length; i += 2) {
      const hexPair = cleanHex.substr(i, 2);
      const charCode = parseInt(hexPair, 16);
      if (!isNaN(charCode)) {
        output += String.fromCharCode(charCode);
      }
    }
    document.getElementById("output").innerText = output || "Invalid hex input!";
  } catch (e) {
    document.getElementById("output").innerText = "Error converting hex!";
  }
}
