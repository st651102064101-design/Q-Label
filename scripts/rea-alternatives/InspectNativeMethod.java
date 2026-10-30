// Standalone Ghidra script: native machine code only. Does not execute the target.
import ghidra.app.script.GhidraScript;
import ghidra.app.decompiler.DecompInterface;
import ghidra.app.decompiler.DecompileResults;
import ghidra.program.model.address.Address;
import ghidra.program.model.listing.Function;
import java.io.PrintWriter;

public class InspectNativeMethod extends GhidraScript {
    private String quote(String s) { if (s == null) return "null"; return "\"" + s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\r", "\\r").replace("\n", "\\n").replace("\t", "\\t") + "\""; }
    public void run() throws Exception {
        String[] args = getScriptArgs();
        if (args.length != 2 && args.length != 3) throw new IllegalArgumentException("Expected RVA and report path, optionally absolute mode");
        long rva = Long.decode(args[0]);
        Address address = args.length == 3 ? toAddr(rva) : currentProgram.getImageBase().add(rva);
        if (currentProgram.getMemory().getBlock(address) == null || !currentProgram.getMemory().getBlock(address).isExecute()) throw new IllegalArgumentException("RVA must be in an executable block");
        disassemble(address);
        Function function = getFunctionAt(address);
        if (function == null) function = createFunction(address, "observed_native_method");
        if (function == null) throw new IllegalStateException("No native function could be created");
        DecompInterface decompiler = new DecompInterface();
        try {
            decompiler.openProgram(currentProgram);
            DecompileResults result = decompiler.decompileFunction(function, 30, monitor);
            String code = result.getDecompiledFunction() == null ? "" : result.getDecompiledFunction().getC();
            try (PrintWriter out = new PrintWriter(args[1], "UTF-8")) {
                out.println("{\"provider\":\"standalone-ghidra\",\"scope\":\"native-machine-code-only\",\"language\":" + quote(currentProgram.getLanguageID().toString()) + ",\"imageBase\":" + quote(currentProgram.getImageBase().toString()) + ",\"inputAddressMode\":" + quote(args.length == 3 ? "absolute" : "rva") + ",\"inputAddress\":" + rva + ",\"address\":" + quote(address.toString()) + ",\"decompileCompleted\":" + result.decompileCompleted() + ",\"error\":" + quote(result.getErrorMessage()) + ",\"code\":" + quote(code) + "}");
            }
            println("NATIVE_METHOD_REPORT " + args[1]);
        } finally { decompiler.dispose(); }
    }
}
