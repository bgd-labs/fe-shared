import { WalletIdentityFlag, WalletLabel } from '../types';

export const mykey = {
  identityFlag: WalletIdentityFlag.MyKey,
  label: WalletLabel.MyKey,
  icon: `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="Layer_1" x="0px" y="0px" width="100%" viewBox="0 0 960 960" enable-background="new 0 0 960 960" xml:space="preserve">
<path fill="#50C3AF" opacity="1.000000" stroke="none" d=" M785.468628,961.000000   C776.803894,959.350159 768.496338,958.118530 760.432739,955.971130   C737.250488,949.797668 716.125916,939.468445 698.020691,923.490479   C692.671936,918.770203 687.442322,913.896301 682.395874,908.854797   C616.745117,843.266968 551.136902,777.636475 485.520416,712.014282   C484.106964,710.600708 482.722595,709.158081 481.444214,707.259094   C482.530060,705.871887 483.517731,704.975952 484.459564,704.034180   C557.723572,630.776062 630.984497,557.514832 704.239502,484.247742   C705.297485,483.189606 706.277893,482.053986 707.423828,480.958252   C707.553162,480.961945 707.809265,480.998962 707.990601,481.287781   C775.072266,548.508240 841.983154,615.429382 908.851868,682.392639   C913.892395,687.440186 918.767273,692.668884 923.487549,698.017761   C939.466125,716.123962 949.795227,737.250122 955.971069,760.432556   C958.119202,768.496033 959.350159,776.803772 961.000000,785.000000   C961.000000,795.354248 961.000000,805.708435 960.699646,816.807007   C959.422241,823.744873 958.855591,830.036621 957.400391,836.115784   C949.051819,870.992554 931.642883,900.314941 904.048035,923.586609   C885.595703,939.148010 864.749512,949.808289 841.565186,955.972229   C833.501221,958.116089 825.195374,959.350342 817.000000,961.000000   C806.645752,961.000000 796.291565,961.000000 785.468628,961.000000  z"/>
<path fill="#50C3AF" opacity="1.000000" stroke="none" d=" M176.531342,1.000000   C185.194641,2.649679 193.499466,3.884716 201.563019,6.027626   C224.746811,12.188758 245.591248,22.849539 264.042572,38.408669   C291.636627,61.677402 309.100433,90.983574 317.410706,125.868103   C321.594574,143.430908 321.943298,161.249191 320.105255,179.202133   C317.414551,205.483795 308.272461,229.383118 293.471558,251.029968   C268.320282,287.814575 233.442276,310.649811 189.819946,318.655823   C146.733795,326.563416 106.332184,317.889099 70.118965,292.944305   C33.756706,267.896759 12.014362,232.939423 3.159775,189.844971   C2.330838,185.810608 2.106062,181.652100 1.300389,177.275620   C1.000000,166.645767 1.000000,156.291550 1.300389,145.193039   C2.577754,138.255310 3.143812,131.963455 4.599560,125.884666   C12.951509,91.009346 30.358313,61.686413 57.952297,38.411667   C76.404732,22.847561 97.255745,12.199543 120.435776,6.028357   C128.498611,3.881797 136.804901,2.649729 145.000000,1.000000   C155.354233,1.000000 165.708450,1.000000 176.531342,1.000000  z"/>
<path fill="#0091E6" opacity="1.000000" stroke="none" d=" M0.999999,784.468628   C2.641399,776.346985 4.051217,768.635437 5.967208,761.051819   C11.939896,737.411560 22.963074,716.400940 38.695362,697.713562   C57.767250,675.059265 81.335739,659.161682 109.192093,649.483643   C121.545135,645.191833 134.339737,643.314514 147.335327,641.750305   C163.236053,639.836548 178.889999,641.364380 194.149643,644.431396   C219.517746,649.530029 242.528580,660.540039 262.666443,677.168213   C286.693878,697.008179 303.771606,721.748230 313.200623,751.282776   C316.970459,763.091064 318.008820,775.800598 319.967407,788.151123   C322.842377,806.280212 320.046448,824.157166 315.821350,841.657715   C310.352722,864.308838 299.620636,884.557190 284.808563,902.626526   C265.044159,926.737183 240.207031,943.592224 210.749634,953.260620   C200.035690,956.777100 188.581055,958.036743 177.232178,960.663086   C166.645767,961.000000 156.291550,961.000000 145.231537,960.660767   C141.430939,959.892578 138.330750,959.499023 135.242142,959.029236   C104.858765,954.407715 78.214096,941.485107 55.276588,921.389648   C29.661320,898.947937 12.954733,870.796692 5.049047,837.589050   C3.430426,830.790100 2.336047,823.866272 1.000004,817.000000   C1.000000,806.312439 1.000000,795.624878 0.999999,784.468628  z"/>
<path fill="#0091E6" opacity="1.000000" stroke="none" d=" M675.975464,59.858551   C691.346619,42.691471 708.519775,27.772612 729.323730,17.462286   C746.446899,8.976150 764.621704,4.011820 783.773621,1.334403   C794.687561,1.000000 805.375122,1.000000 816.757690,1.334358   C830.232178,3.718503 842.827209,6.155451 855.208008,10.374810   C875.660950,17.345125 893.314880,28.518242 909.213074,42.775089   C922.912903,55.060520 934.025024,69.496231 942.650085,85.696716   C949.466553,98.499931 954.438416,112.072708 957.078857,126.430870   C958.222717,132.650589 959.683289,138.812057 961.000000,145.000000   C961.000000,155.687561 961.000000,166.375122 960.668457,177.751465   C954.932861,221.298431 935.840637,256.811279 902.839966,285.108887   C902.040833,285.532501 901.544739,285.870483 901.055420,286.143127   C901.062195,286.077820 901.192871,286.091522 900.939880,286.195557   C900.488464,286.597107 900.289978,286.894623 900.091675,287.141632   C900.091858,287.091125 900.192871,287.091522 899.939880,287.195557   C899.488464,287.597107 899.289978,287.894623 899.091675,288.141632   C899.091858,288.091125 899.192871,288.091522 898.939880,288.195557   C898.488464,288.597107 898.289978,288.894623 898.112549,289.155945   C898.133667,289.119781 898.205994,289.162048 897.846008,289.164856   C890.015747,293.766937 882.823914,298.915253 875.026611,302.869843   C842.326538,319.454376 807.935425,324.935242 771.646240,318.193207   C735.894714,311.551056 706.077698,294.458740 681.783997,267.735596   C665.715393,250.060089 654.302979,229.604767 647.673157,206.539963   C641.831482,186.217545 639.655212,165.648041 641.905396,144.536697   C644.242737,122.608528 650.412720,102.003662 661.473206,82.907951   C665.188171,76.494179 669.045593,70.162910 672.837891,63.793945   C672.837891,63.793945 672.880310,63.866936 673.096924,63.784004   C673.511536,63.403389 673.709656,63.105698 673.907715,62.808010   C673.907715,62.808014 673.908142,62.908890 674.110840,62.804996   C674.511597,62.403412 674.709656,62.105724 674.907715,61.808022   C674.907715,61.808014 674.921204,61.937801 675.116699,61.770748   C675.533325,61.021980 675.754395,60.440262 675.975464,59.858551  z"/>
<path fill="#2E73D2" opacity="1.000000" stroke="none" d=" M707.294556,480.954559   C706.277893,482.053986 705.297485,483.189606 704.239502,484.247742   C630.984497,557.514832 557.723572,630.776062 484.459564,704.034180   C483.517731,704.975952 482.530060,705.871887 481.280914,706.977539   C479.652985,705.929932 478.260315,704.741638 476.969635,703.451233   C404.387451,630.885925 331.817871,558.308167 259.209015,485.769592   C257.807434,484.369324 255.953766,483.421539 254.159470,482.155792   C255.835526,480.065369 256.550079,478.979248 257.450439,478.078918   C331.790527,403.734283 406.145172,329.404236 481.049866,255.087692   C551.442505,324.943756 621.285767,394.783447 691.122070,464.630066   C696.537842,470.046631 701.904907,475.511902 707.294556,480.954559  z"/>
<path fill="#5FC3E6" opacity="1.000000" stroke="none" d=" M707.423828,480.958252   C701.904907,475.511902 696.537842,470.046631 691.122070,464.630066   C621.285767,394.783447 551.442505,324.943756 481.333252,254.882645   C485.503113,250.163147 489.914032,245.636658 494.382263,241.167480   C552.164673,183.373001 609.953918,125.585403 667.751160,67.805779   C669.157104,66.400276 670.674927,65.106674 672.489258,63.777420   C669.045593,70.162910 665.188171,76.494179 661.473206,82.907951   C650.412720,102.003662 644.242737,122.608528 641.905396,144.536697   C639.655212,165.648041 641.831482,186.217545 647.673157,206.539963   C654.302979,229.604767 665.715393,250.060089 681.783997,267.735596   C706.077698,294.458740 735.894714,311.551056 771.646240,318.193207   C807.935425,324.935242 842.326538,319.454376 875.026611,302.869843   C882.823914,298.915253 890.015747,293.766937 897.846008,289.164856   C896.916626,290.814575 895.785217,292.624908 894.315063,294.096863   C832.274536,356.214722 770.203857,418.302368 707.973022,480.696350   C707.809265,480.998962 707.553162,480.961945 707.423828,480.958252  z"/>
<path fill="#5FC3E6" opacity="1.000000" stroke="none" d=" M675.689636,60.036377   C675.754395,60.440262 675.533325,61.021980 675.051758,61.777443   C674.995544,61.372196 675.199707,60.793201 675.689636,60.036377  z"/>
<path fill="#5FC3E6" opacity="1.000000" stroke="none" d=" M673.576355,62.793694   C673.709656,63.105698 673.511536,63.403389 673.060364,63.805168   C672.953186,63.532631 673.099060,63.156006 673.576355,62.793694  z"/>
<path fill="#5FC3E6" opacity="1.000000" stroke="none" d=" M674.576294,61.793701   C674.709656,62.105724 674.511597,62.403412 674.060303,62.805176   C673.953125,62.532619 674.099060,62.155991 674.576294,61.793701  z"/>
<path fill="#5FC3E6" opacity="1.000000" stroke="none" d=" M902.839966,285.108887   C902.661926,285.476807 902.180969,285.930328 901.374329,286.296143   C901.544739,285.870483 902.040833,285.532501 902.839966,285.108887  z"/>
<path fill="#5FC3E6" opacity="1.000000" stroke="none" d=" M900.939819,286.195557   C901.047058,286.468048 900.901306,286.844574 900.423523,287.206635   C900.289978,286.894623 900.488464,286.597107 900.939819,286.195557  z"/>
<path fill="#5FC3E6" opacity="1.000000" stroke="none" d=" M899.939880,287.195557   C900.047119,287.468079 899.901367,287.844604 899.423584,288.206635   C899.289978,287.894623 899.488464,287.597107 899.939880,287.195557  z"/>
<path fill="#5FC3E6" opacity="1.000000" stroke="none" d=" M898.939880,288.195557   C899.047119,288.468048 898.901367,288.844604 898.423584,289.206635   C898.289978,288.894623 898.488464,288.597107 898.939880,288.195557  z"/>
</svg>
`,
};
