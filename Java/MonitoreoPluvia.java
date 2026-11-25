import java.util.Locale;
import java.util.Scanner;

/** Pluvia: simulacion de consola del control local de dos desagues con ESP32. */
public class MonitoreoPluvia {
    static final int CAPACIDAD = 20;
    static final double PROFUNDIDAD = 10, FONDO_D1 = 40, FONDO_D2 = 14;
    static final double ALERTA = 50, PELIGRO = 80, CIERRE = 40;
    static final long VIAJE_SERVO = 400, CONFIRMAR = 1000, MOTOR = 4000;
    static final long DOSIS = 5000, CAPACIDAD_AGUA = 20000;
    static final double RELACION_CAUDAL = 1;
    // Una lectura es un momento de monitoreo con los dos desagues.
    static final double[] lecturas = new double[CAPACIDAD];
    // Columnas: d1,h1,p1,d2,h2,p2,adc,tiempo,estado1,estado2,evaluacion,saldo.
    static final double[][] datos = new double[CAPACIDAD][12];
    static final Scanner sc = new Scanner(System.in);
    static int contador = 0, contadorAlertas = 0;
    static boolean finEntrada = false, luz = false;
    static boolean confirmado = false, compuerta = false, motor = false, bomba = false;
    static boolean contandoAlto = false, contandoBajo = false, armado = true, lleno = false;
    static long ahora = 0, anterior = 0, movimiento = 0, comienzoMotor = 0;
    static long comienzoDosis = 0, duracionDosis = 0, desdeAlto = 0, desdeBajo = 0;
    static double disponibleMs = 0;
    static int arranquesMotor = 0, arranquesBomba = 0;

    static double leerNumero(String mensaje) {
        while (!finEntrada) {
            System.out.println(mensaje);
            if (!sc.hasNextLine()) {
                finEntrada = true;
                return 0;
            }
            String texto = sc.nextLine().trim().replace(',', '.');
            if (texto.matches("[+-]?([0-9]+([.][0-9]*)?|[.][0-9]+)")) {
                double numero = Double.parseDouble(texto);
                if (Double.isFinite(numero)) { return numero; }
            }
            System.out.println("Entrada invalida: ingrese un numero finito.");
        }
        return 0;
    }

    static double leerRango(String mensaje, double minimo, double maximo) {
        double valor;
        // do-while obligatorio: repetir hasta cumplir el rango.
        do {
            valor = leerNumero(mensaje);
            if (finEntrada) { return minimo; }
            if (valor < minimo || valor > maximo) {
                System.out.println("Fuera de rango. Intente nuevamente.");
            }
        } while (valor < minimo || valor > maximo);
        return valor;
    }

    static boolean validarDistancia(double distancia, double fondo) {
        return Double.isFinite(distancia) && distancia >= fondo - PROFUNDIDAD
                && distancia <= fondo;
    }

    static double calcularAltura(double distancia, double fondo) {
        return fondo - distancia;
    }

    static double calcularPorcentaje(double altura) {
        return altura / PROFUNDIDAD * 100;
    }

    static int clasificarEstado(double porcentaje) {
        if (porcentaje >= PELIGRO) { return 2; }
        else if (porcentaje >= ALERTA) { return 1; }
        else { return 0; }
    }

    static String nombreEstado(int codigo) {
        switch (codigo) {
            case 1: return "ALERTA";
            case 2: return "PELIGRO";
            default: return "NORMAL";
        }
    }

    static double calcularPromedio(double[] valores, int cantidad) {
        double suma = 0;
        for (int i = 0; i < cantidad; i++) { suma += valores[i]; }
        return cantidad == 0 ? 0 : suma / cantidad;
    }

    static void confirmarVacio() {
        if (!confirmado) { confirmado = true; anterior = ahora; }
    }

    // Traduccion de Control.h: un paso de tiempo del modelo, sin accionar hardware.
    static void pasoControl(long instante, double p1, double p2, boolean hayLuz) {
        long dt = instante - anterior;
        long edadServo = instante - movimiento;
        anterior = instante;
        long entradaMs = 0;
        if (compuerta && edadServo > VIAJE_SERVO) {
            entradaMs = Math.min(dt, edadServo - VIAJE_SERVO);
        }
        disponibleMs = Math.min(CAPACIDAD_AGUA, Math.max(0,
                disponibleMs + entradaMs * RELACION_CAUDAL - (bomba ? dt : 0)));
        boolean validos = Double.isFinite(p1) && Double.isFinite(p2);
        boolean abrir = compuerta;
        if (disponibleMs >= CAPACIDAD_AGUA) { lleno = true; }
        if (disponibleMs <= CAPACIDAD_AGUA - 1000) { lleno = false; }
        if (!confirmado || !validos || lleno || (p1 < CIERRE && p2 < CIERRE)) {
            abrir = false;
        } else if (p1 >= ALERTA || p2 >= ALERTA) { abrir = true; }
        if (abrir != compuerta) { compuerta = abrir; movimiento = instante; }
        boolean servoQuieto = instante - movimiento >= VIAJE_SERVO;
        if (Double.isFinite(p1) && p1 < CIERRE) {
            if (!contandoBajo) { desdeBajo = instante; }
            contandoBajo = true;
            if (instante - desdeBajo >= CONFIRMAR) { armado = true; }
        } else { contandoBajo = false; }
        if (Double.isFinite(p1) && p1 >= PELIGRO) {
            if (!contandoAlto) { desdeAlto = instante; }
            contandoAlto = true;
        } else { contandoAlto = false; }
        if (motor && (!Double.isFinite(p1) || p1 < CIERRE || !servoQuieto
                || instante - comienzoMotor >= MOTOR)) { motor = false; }
        if (confirmado && armado && contandoAlto && servoQuieto
                && instante - desdeAlto >= CONFIRMAR) {
            motor = true; armado = false; comienzoMotor = instante; arranquesMotor++;
        }
        boolean puedeRegar = confirmado && hayLuz && servoQuieto && !motor
                && disponibleMs >= 1;
        if (!puedeRegar || instante - comienzoDosis >= duracionDosis) { bomba = false; }
        if (puedeRegar && !bomba) {
            comienzoDosis = instante;
            duracionDosis = (long) Math.min(DOSIS, disponibleMs);
            bomba = true; arranquesBomba++;
        }
    }

    static void avanzarTiempo(long duracion, double p1, double p2) {
        pasoControl(ahora, p1, p2, luz);
        long fin = ahora + duracion;
        // Tiempo virtual: no se espera ni se usa Thread.sleep.
        while (ahora < fin) {
            ahora += Math.min(10, fin - ahora);
            pasoControl(ahora, p1, p2, luz);
        }
    }

    static void mostrarMenu() {
        System.out.println("\nPLUVIA | ESP32 | SIMULACION DE DOS DESAGUES");
        System.out.println("1. Registrar medicion y simular intervalo");
        System.out.println("2. Consultar estado del sistema");
        System.out.println("3. Evaluar condicion anormal");
        System.out.println("4. Consultar historial");
        System.out.println("5. Consultar alertas generadas");
        System.out.println("6. Mostrar estadisticas de monitoreo");
        System.out.println("7. Finalizar programa");
    }

    static void registrarMedicion() {
        if (contador == CAPACIDAD) { System.out.println("Historial lleno."); return; }
        if (!confirmado) {
            double respuesta = leerRango("Deposito vacio comprobado? 1=si, 0=no:", 0, 1);
            if (respuesta == 1) { confirmarVacio(); }
        }
        double d1, d2;
        do {
            d1 = leerNumero("Distancia sensor-agua D1, de 30 a 40 cm:");
            if (!validarDistancia(d1, FONDO_D1) && !finEntrada) {
                System.out.println("Distancia D1 invalida.");
            }
        } while (!validarDistancia(d1, FONDO_D1) && !finEntrada);
        do {
            d2 = leerNumero("Distancia sensor-agua D2, de 4 a 14 cm:");
            if (!validarDistancia(d2, FONDO_D2) && !finEntrada) {
                System.out.println("Distancia D2 invalida.");
            }
        } while (!validarDistancia(d2, FONDO_D2) && !finEntrada);
        double adc = leerRango("LDR ADC entero de 0 a 4095 (luz <=1400, oscuro >=2000):", 0, 4095);
        if (adc != Math.floor(adc) && !finEntrada) {
            System.out.println("ADC debe ser entero; registro cancelado."); return;
        }
        double segundos = leerRango("Duracion del escenario, de 0 a 120 segundos:", 0, 120);
        if (finEntrada) { return; }
        if (adc <= 1400) { luz = true; }
        if (adc >= 2000) { luz = false; }
        double h1 = calcularAltura(d1, FONDO_D1), h2 = calcularAltura(d2, FONDO_D2);
        double p1 = calcularPorcentaje(h1), p2 = calcularPorcentaje(h2);
        avanzarTiempo(Math.round(segundos * 1000), p1, p2);
        lecturas[contador] = Math.max(p1, p2);
        datos[contador] = new double[] {d1,h1,p1,d2,h2,p2,adc,ahora/1000.0,
                clasificarEstado(p1),clasificarEstado(p2),0,disponibleMs/1000};
        contador++;
        mostrarMedicion(contador - 1);
        mostrarControl();
    }

    static void mostrarMedicion(int i) {
        System.out.printf(Locale.ROOT, "Registro %d | t=%.3f s%n", i+1, datos[i][7]);
        System.out.printf(Locale.ROOT, "D1: d=%.2f cm; h=%.2f cm; %.2f%%; %s%n",
                datos[i][0],datos[i][1],datos[i][2],nombreEstado((int)datos[i][8]));
        System.out.printf(Locale.ROOT, "D2: d=%.2f cm; h=%.2f cm; %.2f%%; %s%n",
                datos[i][3],datos[i][4],datos[i][5],nombreEstado((int)datos[i][9]));
        System.out.printf(Locale.ROOT, "Saldo estimado registrado: %.3f s; evaluacion=%s%n",
                datos[i][11], datos[i][10]==0 ? "PENDIENTE" : datos[i][10]==2 ? "CON ALERTA" : "SIN ALERTA");
    }

    static void mostrarControl() {
        System.out.println("Salidas SIMULADAS: compuerta=" + compuerta + "; motorD1="
                + motor + "; bombaRiego=" + bomba + "; luz=" + luz);
        System.out.printf(Locale.ROOT, "Deposito confirmado=%s; saldo estimado=%.3f s%n",
                confirmado, disponibleMs/1000);
        System.out.println("Arranques motor=" + arranquesMotor + "; dosis riego=" + arranquesBomba);
    }

    static void mostrarEstado() {
        if (contador == 0) { System.out.println("Sin mediciones."); }
        else { mostrarMedicion(contador - 1); mostrarControl(); }
    }

    static void evaluarCondicion() {
        if (contador == 0) { System.out.println("Sin mediciones."); return; }
        int i = contador - 1;
        boolean anormal;
        // if-else obligatorio en opcion 3.
        if (clasificarEstado(lecturas[i]) != 0) {
            anormal = true; System.out.println("Condicion ANORMAL.");
        } else {
            anormal = false; datos[i][10] = 1; System.out.println("Condicion NORMAL.");
        }
        // if simple: contar una alerta por registro evaluado anormal.
        if (anormal) {
            if (datos[i][10] != 2) { contadorAlertas++; datos[i][10] = 2; }
            mostrarMedicion(i);
            System.out.println("Inspeccionar D1/D2 segun su estado. El nivel no confirma basura.");
        }
    }

    static void mostrarHistorial() {
        for (int i = 0; i < contador; i++) { mostrarMedicion(i); }
        if (contador == 0) { System.out.println("Sin mediciones."); }
    }

    static void mostrarAlertas() {
        System.out.println("Alertas generadas: " + contadorAlertas);
        for (int i = 0; i < contador; i++) {
            if (datos[i][10] == 2) { mostrarMedicion(i); }
        }
    }

    static void mostrarEstadisticas() {
        if (contador == 0) { System.out.println("Sin mediciones."); return; }
        double menor = lecturas[0], mayor = lecturas[0];
        for (int i = 0; i < contador; i++) {
            menor = Math.min(menor, lecturas[i]); mayor = Math.max(mayor, lecturas[i]);
            if (i > 0) {
                System.out.printf(Locale.ROOT, "Cambio h D1=%+.2f cm; D2=%+.2f cm%n",
                        datos[i][1]-datos[i-1][1], datos[i][4]-datos[i-1][4]);
            }
        }
        System.out.printf(Locale.ROOT, "Registros=%d; ocupacion maxima por par: min=%.2f%%; max=%.2f%%; media=%.2f%%%n",
                contador, menor, mayor, calcularPromedio(lecturas, contador));
        System.out.println("Alertas generadas: " + contadorAlertas);
    }

    public static void main(String[] args) {
        int opcion = 0;
        System.out.println("Datos manuales y tiempo virtual. No hay conexion al ESP32 ni a la web.");
        while (opcion != 7 && !finEntrada) {
            mostrarMenu();
            double elegida = leerRango("Seleccione opcion entera 1 a 7:", 1, 7);
            opcion = elegida == Math.floor(elegida) ? (int)elegida : 0;
            if (opcion == 0) { System.out.println("Opcion invalida: debe ser entera."); }
            if (finEntrada) { break; }
            switch (opcion) {
                case 1: registrarMedicion(); break;
                case 2: mostrarEstado(); break;
                case 3: evaluarCondicion(); break;
                case 4: mostrarHistorial(); break;
                case 5: mostrarAlertas(); break;
                case 6: mostrarEstadisticas(); break;
                case 7: System.out.println("Programa finalizado."); break;
                default: break;
            }
        }
        sc.close();
    }
}
